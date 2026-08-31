// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {GivexaAssetRegistryV1} from "../src/GivexaAssetRegistryV1.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";
import {GivexaGiftVaultV1} from "../src/GivexaGiftVaultV1.sol";
import {RobinhoodMainnetAssets} from "./RobinhoodMainnetAssets.sol";

interface IRobinhoodStockToken is IERC20Metadata {
    function uiMultiplier() external view returns (uint256);
}

interface IGnosisSafeConfiguration {
    function getThreshold() external view returns (uint256);
    function getOwners() external view returns (address[] memory);
}

/// @notice Strict production deployment. It intentionally has no default private key or governance address.
contract DeployGivexa is Script {
    error WrongChain(uint256 actual);
    error InvalidSafe(address safe);
    error InvalidManifestHash();
    error InvalidAsset(address asset, bytes32 expectedSymbol);

    uint256 internal constant TIMELOCK_DELAY = 48 hours;

    function run()
        external
        returns (
            TimelockController timelock,
            GivexaAssetRegistryV1 registry,
            GivexaFeeControllerV1 fees,
            GivexaGiftVaultV1 vault
        )
    {
        if (block.chainid != RobinhoodMainnetAssets.CHAIN_ID) {
            revert WrongChain(block.chainid);
        }

        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address safe = vm.envAddress("GIVEXA_SAFE");
        address treasury = vm.envAddress("GIVEXA_TREASURY");
        bytes32 manifestHash = vm.envBytes32("OFFICIAL_ASSET_MANIFEST_HASH");
        if (manifestHash == bytes32(0)) revert InvalidManifestHash();
        _validateTwoOfThreeSafe(safe);
        if (treasury == address(0)) revert InvalidSafe(treasury);

        address[] memory assets = RobinhoodMainnetAssets.addresses();
        bytes32[] memory symbols = RobinhoodMainnetAssets.symbols();
        bytes32[] memory provenance = new bytes32[](assets.length);
        for (uint256 i; i < assets.length; ++i) {
            _validateAsset(assets[i], symbols[i]);
            provenance[i] = keccak256(abi.encode(manifestHash, block.chainid, assets[i], symbols[i]));
        }

        vm.startBroadcast(deployerKey);
        registry = new GivexaAssetRegistryV1(deployer);
        fees = new GivexaFeeControllerV1(deployer, treasury);
        vault = new GivexaGiftVaultV1(deployer, safe, registry, fees);
        registry.registerAssets(assets, symbols, provenance);

        address[] memory proposers = new address[](1);
        proposers[0] = safe;
        address[] memory executors = new address[](1);
        executors[0] = address(0);
        timelock = new TimelockController(TIMELOCK_DELAY, proposers, executors, address(0));

        registry.transferOwnership(address(timelock));
        fees.transferOwnership(address(timelock));
        vault.transferOwnership(address(timelock));
        vm.stopBroadcast();

        console2.log("Timelock", address(timelock));
        console2.log("AssetRegistry", address(registry));
        console2.log("FeeController", address(fees));
        console2.log("GiftVault", address(vault));
    }

    function _validateTwoOfThreeSafe(address safe) internal view {
        if (safe.code.length == 0) revert InvalidSafe(safe);
        try IGnosisSafeConfiguration(safe).getThreshold() returns (uint256 threshold) {
            if (threshold != 2) revert InvalidSafe(safe);
        } catch {
            revert InvalidSafe(safe);
        }
        try IGnosisSafeConfiguration(safe).getOwners() returns (address[] memory owners) {
            if (owners.length != 3) revert InvalidSafe(safe);
        } catch {
            revert InvalidSafe(safe);
        }
    }

    function _validateAsset(address asset, bytes32 expectedSymbol) internal view {
        if (asset.code.length == 0) revert InvalidAsset(asset, expectedSymbol);
        IRobinhoodStockToken token = IRobinhoodStockToken(asset);
        if (token.decimals() != 18) revert InvalidAsset(asset, expectedSymbol);
        if (RobinhoodMainnetAssets.toBytes32(token.symbol()) != expectedSymbol) {
            revert InvalidAsset(asset, expectedSymbol);
        }
        if (token.uiMultiplier() == 0) revert InvalidAsset(asset, expectedSymbol);
    }
}
