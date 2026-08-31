// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {GivexaAssetRegistryV1} from "../src/GivexaAssetRegistryV1.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";
import {GivexaGiftVaultV1} from "../src/GivexaGiftVaultV1.sol";
import {MockStockToken} from "./mocks/MockStockToken.sol";

contract GiftVaultHandler is Test {
    MockStockToken public immutable token;
    GivexaGiftVaultV1 public immutable vault;
    uint256 public giftCount;
    mapping(uint256 giftId => bytes32 secret) public secrets;

    constructor(MockStockToken token_, GivexaGiftVaultV1 vault_) {
        token = token_;
        vault = vault_;
        token.approve(address(vault), type(uint256).max);
    }

    function create(uint128 rawPrincipal, uint32 rawDuration) external {
        uint128 principal = uint128(bound(rawPrincipal, 1, 1_000 ether));
        uint32 duration = uint32(bound(rawDuration, 7 days, 365 days));
        bytes32 secret = keccak256(abi.encode(giftCount, rawPrincipal, rawDuration));
        token.mint(address(this), uint256(principal) + (uint256(principal) / 100));
        uint256 giftId = vault.createGift(
            GivexaGiftVaultV1.CreateGiftParams({
                asset: address(token),
                principal: principal,
                secretHash: vault.hashSecret(secret),
                claimCodeHash: bytes32(0),
                unlockAt: 0,
                expiryDuration: duration
            })
        );
        secrets[giftId] = secret;
        giftCount = giftId;
    }

    function claim(uint256 seed) external {
        if (giftCount == 0) return;
        uint256 giftId = bound(seed, 1, giftCount);
        if (vault.displayStatus(giftId) != GivexaGiftVaultV1.DisplayStatus.Active) return;
        vault.claim(giftId, secrets[giftId], "");
    }

    function cancel(uint256 seed) external {
        if (giftCount == 0) return;
        uint256 giftId = bound(seed, 1, giftCount);
        GivexaGiftVaultV1.DisplayStatus status = vault.displayStatus(giftId);
        if (status != GivexaGiftVaultV1.DisplayStatus.Active && status != GivexaGiftVaultV1.DisplayStatus.Expired) {
            return;
        }
        vault.cancel(giftId);
    }

    function advanceAndRecover(uint256 seed, uint32 rawTime) external {
        if (giftCount == 0) return;
        vm.warp(block.timestamp + bound(rawTime, 1, 400 days));
        uint256 giftId = bound(seed, 1, giftCount);
        if (vault.displayStatus(giftId) != GivexaGiftVaultV1.DisplayStatus.Expired) return;
        vault.recoverExpired(giftId);
    }
}

contract GivexaInvariantTest is StdInvariant, Test {
    MockStockToken internal token;
    GivexaGiftVaultV1 internal vault;
    GiftVaultHandler internal handler;

    function setUp() public {
        token = new MockStockToken("NVIDIA Robinhood Token", "NVDA");
        GivexaAssetRegistryV1 registry = new GivexaAssetRegistryV1(address(this));
        GivexaFeeControllerV1 fees = new GivexaFeeControllerV1(address(this), makeAddr("treasury"));
        vault = new GivexaGiftVaultV1(address(this), makeAddr("guardian"), registry, fees);
        registry.registerAsset(address(token), bytes32("NVDA"), keccak256("official-manifest"));
        handler = new GiftVaultHandler(token, vault);
        targetContract(address(handler));
    }

    function invariant_VaultIsAlwaysSolvent() public view {
        assertGe(token.balanceOf(address(vault)), vault.totalEscrowed(address(token)));
    }

    function invariant_RecordedLiabilityEqualsAllStoredActivePrincipal() public view {
        uint256 expectedLiability;
        uint256 end = vault.nextGiftId();
        for (uint256 giftId = 1; giftId < end; ++giftId) {
            GivexaGiftVaultV1.Gift memory giftData = vault.gift(giftId);
            if (giftData.status == GivexaGiftVaultV1.StoredStatus.Active) expectedLiability += giftData.principal;
        }
        assertEq(vault.totalEscrowed(address(token)), expectedLiability);
    }
}
