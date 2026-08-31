// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {GivexaAssetRegistryV1} from "../src/GivexaAssetRegistryV1.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";
import {MockStockToken, MockSixDecimalToken} from "./mocks/MockStockToken.sol";

contract RegistryAndFeeTest is Test {
    function test_RegistryValidatesCodeDecimalsAndOwnership() public {
        GivexaAssetRegistryV1 registry = new GivexaAssetRegistryV1(address(this));
        MockStockToken token = new MockStockToken("Apple", "AAPL");
        registry.registerAsset(address(token), bytes32("AAPL"), keccak256("manifest"));
        assertTrue(registry.isSupported(address(token)));

        vm.expectRevert(abi.encodeWithSelector(GivexaAssetRegistryV1.AssetAlreadyRegistered.selector, address(token)));
        registry.registerAsset(address(token), bytes32("AAPL"), keccak256("manifest"));

        address attacker = makeAddr("attacker");
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, attacker));
        registry.setSupported(address(token), false);
    }

    function test_FeeDefaultsToHalfPercentAndCannotExceedOnePercent() public {
        GivexaFeeControllerV1 fees = new GivexaFeeControllerV1(address(this), makeAddr("treasury"));
        assertEq(fees.quoteFee(100 ether), 0.5 ether);
        fees.setFeeBps(100);
        assertEq(fees.quoteFee(100 ether), 1 ether);
        vm.expectRevert(abi.encodeWithSelector(GivexaFeeControllerV1.FeeAboveCap.selector, 101, 100));
        fees.setFeeBps(101);
    }

    function test_RegistryRejectsInvalidAssetsAndBatchLengths() public {
        GivexaAssetRegistryV1 registry = new GivexaAssetRegistryV1(address(this));
        vm.expectRevert(GivexaAssetRegistryV1.ZeroAddress.selector);
        registry.registerAsset(address(0), bytes32("ZERO"), bytes32(0));

        vm.expectRevert(GivexaAssetRegistryV1.EmptySymbol.selector);
        registry.registerAsset(address(0xBEEF), bytes32(0), bytes32(0));

        vm.expectRevert(abi.encodeWithSelector(GivexaAssetRegistryV1.NotAContract.selector, address(0xBEEF)));
        registry.registerAsset(address(0xBEEF), bytes32("EOA"), bytes32(0));

        MockSixDecimalToken six = new MockSixDecimalToken();
        vm.expectRevert(abi.encodeWithSelector(GivexaAssetRegistryV1.UnsupportedDecimals.selector, address(six), 6));
        registry.registerAsset(address(six), bytes32("SIX"), bytes32(0));

        address[] memory assets = new address[](1);
        bytes32[] memory symbols = new bytes32[](0);
        bytes32[] memory provenance = new bytes32[](1);
        vm.expectRevert(GivexaAssetRegistryV1.ArrayLengthMismatch.selector);
        registry.registerAssets(assets, symbols, provenance);
    }

    function test_RegistrySupportAndProvenanceChangesRequireRegisteredAsset() public {
        GivexaAssetRegistryV1 registry = new GivexaAssetRegistryV1(address(this));
        address unknown = address(0xCAFE);
        vm.expectRevert(abi.encodeWithSelector(GivexaAssetRegistryV1.AssetNotRegistered.selector, unknown));
        registry.setSupported(unknown, false);
        vm.expectRevert(abi.encodeWithSelector(GivexaAssetRegistryV1.AssetNotRegistered.selector, unknown));
        registry.setProvenanceHash(unknown, bytes32(uint256(1)));

        MockStockToken token = new MockStockToken("Meta", "META");
        registry.registerAsset(address(token), bytes32("META"), bytes32(uint256(1)));
        registry.setSupported(address(token), false);
        assertFalse(registry.isSupported(address(token)));
        registry.setSupported(address(token), false);
        registry.setProvenanceHash(address(token), bytes32(uint256(2)));
        assertEq(registry.assetConfig(address(token)).provenanceHash, bytes32(uint256(2)));
    }

    function test_FeeTreasuryValidationAndChanges() public {
        address treasury = makeAddr("treasury");
        GivexaFeeControllerV1 fees = new GivexaFeeControllerV1(address(this), treasury);
        fees.setFeeBps(0);
        assertEq(fees.quoteFee(100 ether), 0);
        address nextTreasury = makeAddr("next-treasury");
        fees.setTreasury(nextTreasury);
        assertEq(fees.treasury(), nextTreasury);
        vm.expectRevert(GivexaFeeControllerV1.ZeroAddress.selector);
        fees.setTreasury(address(0));
    }

    function test_ZeroAddressConstructorsRevert() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));
        new GivexaAssetRegistryV1(address(0));
        vm.expectRevert(GivexaFeeControllerV1.ZeroAddress.selector);
        new GivexaFeeControllerV1(address(this), address(0));
    }
}
