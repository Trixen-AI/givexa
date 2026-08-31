// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {GivexaAssetRegistryV1} from "../src/GivexaAssetRegistryV1.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";
import {GivexaGiftVaultV1} from "../src/GivexaGiftVaultV1.sol";
import {MockStockToken, MockFeeOnTransferToken} from "./mocks/MockStockToken.sol";

contract GivexaGiftVaultV1Test is Test {
    GivexaAssetRegistryV1 internal registry;
    GivexaFeeControllerV1 internal fees;
    GivexaGiftVaultV1 internal vault;
    MockStockToken internal token;

    address internal sender = makeAddr("sender");
    address internal recipient = makeAddr("recipient");
    address internal treasury = makeAddr("treasury");
    address internal guardian = makeAddr("guardian");
    address internal stranger = makeAddr("stranger");
    bytes32 internal secret = keccak256("high-entropy-secret");
    bytes internal claimCode = "A1B2C3D4";

    function setUp() public {
        token = new MockStockToken("NVIDIA Robinhood Token", "NVDA");
        registry = new GivexaAssetRegistryV1(address(this));
        fees = new GivexaFeeControllerV1(address(this), treasury);
        vault = new GivexaGiftVaultV1(address(this), guardian, registry, fees);
        registry.registerAsset(address(token), bytes32("NVDA"), keccak256("official-manifest"));
        token.mint(sender, 10_000_000 ether);
        vm.prank(sender);
        token.approve(address(vault), type(uint256).max);
    }

    function test_CreateAndClaimImmediateGiftWithCode() public {
        uint128 principal = 100 ether;
        uint256 giftId = _create(principal, 0, 30 days, true);

        assertEq(token.balanceOf(address(vault)), principal);
        assertEq(token.balanceOf(treasury), 0.5 ether);
        assertEq(vault.totalEscrowed(address(token)), principal);
        assertEq(uint256(vault.displayStatus(giftId)), uint256(GivexaGiftVaultV1.DisplayStatus.Active));

        vm.prank(recipient);
        vault.claim(giftId, secret, claimCode);

        assertEq(token.balanceOf(recipient), principal);
        assertEq(token.balanceOf(address(vault)), 0);
        assertEq(vault.totalEscrowed(address(token)), 0);
        assertEq(uint256(vault.displayStatus(giftId)), uint256(GivexaGiftVaultV1.DisplayStatus.Claimed));
    }

    function test_ClaimDestinationIsAlwaysCaller() public {
        uint256 giftId = _create(10 ether, 0, 30 days, false);
        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        assertEq(token.balanceOf(recipient), 10 ether);
        assertEq(token.balanceOf(stranger), 0);
    }

    function test_ScheduledGiftUnlockAndExpiryStartAtUnlock() public {
        uint40 unlockAt = uint40(block.timestamp + 1 days);
        uint256 giftId = _create(20 ether, unlockAt, 14 days, false);
        GivexaGiftVaultV1.Gift memory created = vault.gift(giftId);
        assertEq(created.expiresAt, unlockAt + 14 days);
        assertEq(uint256(vault.displayStatus(giftId)), uint256(GivexaGiftVaultV1.DisplayStatus.Scheduled));

        vm.prank(recipient);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.GiftLocked.selector, unlockAt));
        vault.claim(giftId, secret, "");

        vm.warp(unlockAt);
        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        assertEq(token.balanceOf(recipient), 20 ether);
    }

    function test_SenderCanCancelBeforeOrAfterUnlock() public {
        uint256 senderBefore = token.balanceOf(sender);
        uint256 giftId = _create(50 ether, uint40(block.timestamp + 2 days), 30 days, false);
        vm.warp(block.timestamp + 3 days);
        vm.prank(sender);
        vault.cancel(giftId);
        assertEq(token.balanceOf(sender), senderBefore - 0.25 ether);
        assertEq(uint256(vault.displayStatus(giftId)), uint256(GivexaGiftVaultV1.DisplayStatus.Cancelled));
    }

    function test_AnyoneCanTriggerRecoveryButFundsOnlyReturnToSender() public {
        uint256 senderBefore = token.balanceOf(sender);
        uint256 giftId = _create(80 ether, 0, 7 days, false);
        vm.warp(block.timestamp + 7 days);
        vm.prank(stranger);
        vault.recoverExpired(giftId);
        assertEq(token.balanceOf(sender), senderBefore - 0.4 ether);
        assertEq(token.balanceOf(stranger), 0);
        assertEq(uint256(vault.displayStatus(giftId)), uint256(GivexaGiftVaultV1.DisplayStatus.Returned));
    }

    function test_PauseBlocksOnlyCreationAndGuardianCannotUnpause() public {
        uint256 giftId = _create(10 ether, 0, 30 days, false);
        vm.prank(guardian);
        vault.pauseCreation();

        GivexaGiftVaultV1.CreateGiftParams memory pausedParams = _params(1 ether, 0, 30 days, false);
        vm.prank(sender);
        vm.expectRevert(GivexaGiftVaultV1.CreationPaused.selector);
        vault.createGift(pausedParams);

        vm.prank(guardian);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, guardian));
        vault.unpauseCreation();

        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        assertEq(token.balanceOf(recipient), 10 ether);
    }

    function test_DisablingAssetOnlyBlocksNewGifts() public {
        uint256 giftId = _create(10 ether, 0, 30 days, false);
        registry.setSupported(address(token), false);

        GivexaGiftVaultV1.CreateGiftParams memory disabledParams = _params(1 ether, 0, 30 days, false);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.UnsupportedAsset.selector, address(token)));
        vault.createGift(disabledParams);

        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        assertEq(token.balanceOf(recipient), 10 ether);
    }

    function test_PrincipalCannotBeSwept() public {
        _create(100 ether, 0, 30 days, false);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.InsufficientExcess.selector, 1, 0));
        vault.sweepExcess(address(token), address(this), 1);
    }

    function test_OnlyExcessCanBeSwept() public {
        _create(100 ether, 0, 30 days, false);
        token.mint(address(vault), 3 ether);
        vault.sweepExcess(address(token), address(this), 3 ether);
        assertEq(token.balanceOf(address(vault)), 100 ether);
        assertEq(vault.totalEscrowed(address(token)), 100 ether);
    }

    function test_InvalidSecretAndCodeRevert() public {
        uint256 giftId = _create(10 ether, 0, 30 days, true);
        vm.prank(recipient);
        vm.expectRevert(GivexaGiftVaultV1.InvalidSecret.selector);
        vault.claim(giftId, bytes32(uint256(123)), claimCode);

        vm.prank(recipient);
        vm.expectRevert(GivexaGiftVaultV1.InvalidClaimCode.selector);
        vault.claim(giftId, secret, "XXXXXXXX");
    }

    function test_TerminalGiftCannotBeClaimedTwice() public {
        uint256 giftId = _create(10 ether, 0, 30 days, false);
        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.GiftNotActive.selector, giftId));
        vault.claim(giftId, secret, "");
    }

    function test_CreateValidationRejectsInvalidInputs() public {
        GivexaGiftVaultV1.CreateGiftParams memory params = _params(1 ether, 0, 30 days, false);

        params.asset = address(0xBEEF);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.UnsupportedAsset.selector, address(0xBEEF)));
        vault.createGift(params);

        params = _params(0, 0, 30 days, false);
        vm.prank(sender);
        vm.expectRevert(GivexaGiftVaultV1.ZeroPrincipal.selector);
        vault.createGift(params);

        params = _params(1 ether, 0, 30 days, false);
        params.secretHash = bytes32(0);
        vm.prank(sender);
        vm.expectRevert(GivexaGiftVaultV1.EmptySecretHash.selector);
        vault.createGift(params);

        params = _params(1 ether, 0, 7 days - 1, false);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.ExpiryOutOfRange.selector, 7 days, 365 days));
        vault.createGift(params);

        params = _params(1 ether, 0, 365 days + 1, false);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.ExpiryOutOfRange.selector, 7 days, 365 days));
        vault.createGift(params);
    }

    function test_ScheduleValidationRejectsTooSoonAndTooFar() public {
        uint256 earliest = block.timestamp + 10 minutes;
        GivexaGiftVaultV1.CreateGiftParams memory params =
            _params(1 ether, uint40(block.timestamp + 10 minutes - 1), 30 days, false);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.ScheduleTooSoon.selector, earliest));
        vault.createGift(params);

        uint256 latest = block.timestamp + 365 days;
        params = _params(1 ether, uint40(latest + 1), 30 days, false);
        vm.prank(sender);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.ScheduleTooFar.selector, latest));
        vault.createGift(params);
    }

    function test_ClaimAndRecoveryRespectExactExpiryBoundary() public {
        uint256 giftId = _create(1 ether, 0, 7 days, false);
        uint256 expiresAt = vault.gift(giftId).expiresAt;

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.GiftNotExpired.selector, expiresAt));
        vault.recoverExpired(giftId);

        vm.warp(expiresAt);
        vm.prank(recipient);
        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.GiftExpired.selector, expiresAt));
        vault.claim(giftId, secret, "");

        vm.prank(stranger);
        vault.recoverExpired(giftId);
    }

    function test_AccessControlAndMissingGiftErrors() public {
        vm.prank(stranger);
        vm.expectRevert(GivexaGiftVaultV1.NotGuardian.selector);
        vault.pauseCreation();

        uint256 giftId = _create(1 ether, 0, 30 days, false);
        vm.prank(stranger);
        vm.expectRevert(GivexaGiftVaultV1.NotGiftSender.selector);
        vault.cancel(giftId);

        vm.expectRevert(abi.encodeWithSelector(GivexaGiftVaultV1.GiftNotFound.selector, 999));
        vault.gift(999);
        assertEq(uint256(vault.displayStatus(999)), uint256(GivexaGiftVaultV1.DisplayStatus.Nonexistent));
    }

    function test_OwnerCanUnpauseAndRotateGuardian() public {
        vm.prank(guardian);
        vault.pauseCreation();
        vault.unpauseCreation();
        assertFalse(vault.creationPaused());

        vault.setGuardian(stranger);
        assertEq(vault.guardian(), stranger);
        vm.expectRevert(GivexaGiftVaultV1.ZeroAddress.selector);
        vault.setGuardian(address(0));
    }

    function test_SweepDetectsInsolvencyAndInvalidRecipient() public {
        _create(10 ether, 0, 30 days, false);
        token.burn(address(vault), 1 ether);
        vm.expectRevert(
            abi.encodeWithSelector(GivexaGiftVaultV1.InsolventAsset.selector, address(token), 9 ether, 10 ether)
        );
        vault.sweepExcess(address(token), address(this), 0);

        token.mint(address(vault), 1 ether);
        vm.expectRevert(GivexaGiftVaultV1.ZeroAddress.selector);
        vault.sweepExcess(address(token), address(0), 0);
    }

    function test_FeeOnTransferAssetIsRejectedAtomically() public {
        MockFeeOnTransferToken taxed = new MockFeeOnTransferToken();
        registry.registerAsset(address(taxed), bytes32("TAX"), keccak256("test"));
        taxed.mint(sender, 1_000 ether);
        vm.prank(sender);
        taxed.approve(address(vault), type(uint256).max);
        GivexaGiftVaultV1.CreateGiftParams memory params = _params(100 ether, 0, 30 days, false);
        params.asset = address(taxed);

        vm.prank(sender);
        vm.expectRevert(
            abi.encodeWithSelector(GivexaGiftVaultV1.UnexpectedTransferAmount.selector, 100 ether, 99 ether)
        );
        vault.createGift(params);
        assertEq(taxed.balanceOf(address(vault)), 0);
    }

    function testFuzz_FeeAndSolvency(uint128 rawPrincipal, uint32 rawDuration) public {
        uint128 principal = uint128(bound(rawPrincipal, 1, 1_000_000 ether));
        uint32 duration = uint32(bound(rawDuration, 7 days, 365 days));
        uint256 expectedFee = uint256(principal) * 50 / 10_000;
        uint256 giftId = _create(principal, 0, duration, false);
        assertEq(token.balanceOf(treasury), expectedFee);
        assertGe(token.balanceOf(address(vault)), vault.totalEscrowed(address(token)));

        vm.prank(recipient);
        vault.claim(giftId, secret, "");
        assertGe(token.balanceOf(address(vault)), vault.totalEscrowed(address(token)));
    }

    function testFuzz_ScheduleBounds(uint40 rawDelay) public {
        uint256 delay = bound(rawDelay, 10 minutes, 365 days);
        uint40 unlockAt = uint40(block.timestamp + delay);
        uint256 giftId = _create(1 ether, unlockAt, 7 days, false);
        assertEq(vault.gift(giftId).unlockAt, unlockAt);
    }

    function _create(uint128 principal, uint40 unlockAt, uint32 duration, bool withCode) internal returns (uint256) {
        GivexaGiftVaultV1.CreateGiftParams memory params = _params(principal, unlockAt, duration, withCode);
        vm.prank(sender);
        return vault.createGift(params);
    }

    function _params(uint128 principal, uint40 unlockAt, uint32 duration, bool withCode)
        internal
        view
        returns (GivexaGiftVaultV1.CreateGiftParams memory)
    {
        return GivexaGiftVaultV1.CreateGiftParams({
            asset: address(token),
            principal: principal,
            secretHash: vault.hashSecret(secret),
            claimCodeHash: withCode ? vault.hashClaimCode(secret, claimCode) : bytes32(0),
            unlockAt: unlockAt,
            expiryDuration: duration
        });
    }
}
