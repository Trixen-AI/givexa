// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {GivexaAssetRegistryV1} from "../src/GivexaAssetRegistryV1.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";
import {GivexaGiftVaultV1} from "../src/GivexaGiftVaultV1.sol";
import {IGivexaAssetRegistryV1} from "../src/interfaces/IGivexaAssetRegistryV1.sol";
import {RobinhoodMainnetAssets} from "./RobinhoodMainnetAssets.sol";
import {IRobinhoodStockToken} from "./DeployGivexa.s.sol";

/// @notice Fork-only deployment simulation. Never invoke this script with --broadcast.
contract DryRunRobinhoodMainnet is Script {
    error WrongChain(uint256 actual);
    error AssetVerificationFailed(address asset, bytes32 symbol);
    error GovernanceWiringFailed();

    uint256 internal constant TIMELOCK_DELAY = 48 hours;

    function run()
        external
        returns (address timelockAddress, address registryAddress, address feesAddress, address vaultAddress)
    {
        if (block.chainid != RobinhoodMainnetAssets.CHAIN_ID) revert WrongChain(block.chainid);

        address operatorSimulation = vm.addr(0xA11CE);
        address safeSimulation = address(0x0000000000000000000000000000000000005aFE);
        address treasurySimulation = address(0x000000000000000000000000000000000000Fee5);
        GivexaAssetRegistryV1 registry = new GivexaAssetRegistryV1(operatorSimulation);
        GivexaFeeControllerV1 fees = new GivexaFeeControllerV1(operatorSimulation, treasurySimulation);
        GivexaGiftVaultV1 vault = new GivexaGiftVaultV1(operatorSimulation, safeSimulation, registry, fees);

        address[] memory assets = RobinhoodMainnetAssets.addresses();
        bytes32[] memory symbols = RobinhoodMainnetAssets.symbols();
        bytes32[] memory provenance = new bytes32[](assets.length);
        for (uint256 i; i < assets.length; ++i) {
            _verifyAsset(assets[i], symbols[i]);
            provenance[i] = keccak256(abi.encode("DRY_RUN_OFFICIAL_RHJ_API_2026_08_30", assets[i], symbols[i]));
        }
        vm.startPrank(operatorSimulation);
        registry.registerAssets(assets, symbols, provenance);

        address[] memory proposers = new address[](1);
        proposers[0] = safeSimulation;
        address[] memory executors = new address[](1);
        executors[0] = address(0);
        TimelockController timelock = new TimelockController(TIMELOCK_DELAY, proposers, executors, address(0));
        registry.transferOwnership(address(timelock));
        fees.transferOwnership(address(timelock));
        vault.transferOwnership(address(timelock));
        vm.stopPrank();

        if (
            registry.owner() != address(timelock) || fees.owner() != address(timelock)
                || vault.owner() != address(timelock) || vault.guardian() != safeSimulation
                || timelock.getMinDelay() != TIMELOCK_DELAY
        ) revert GovernanceWiringFailed();

        for (uint256 i; i < assets.length; ++i) {
            IGivexaAssetRegistryV1.AssetConfig memory config = registry.assetConfig(assets[i]);
            if (!config.supported || config.symbol != symbols[i]) {
                revert AssetVerificationFailed(assets[i], symbols[i]);
            }
        }

        timelockAddress = address(timelock);
        registryAddress = address(registry);
        feesAddress = address(fees);
        vaultAddress = address(vault);
        console2.log("DRY RUN ONLY. No transactions were broadcast.");
        console2.log("Verified assets", assets.length);
        console2.log("Timelock", timelockAddress);
        console2.log("AssetRegistry", registryAddress);
        console2.log("FeeController", feesAddress);
        console2.log("GiftVault", vaultAddress);
    }

    function _verifyAsset(address asset, bytes32 expectedSymbol) internal view {
        if (asset.code.length == 0) revert AssetVerificationFailed(asset, expectedSymbol);
        IRobinhoodStockToken token = IRobinhoodStockToken(asset);
        if (
            token.decimals() != 18 || token.uiMultiplier() == 0
                || RobinhoodMainnetAssets.toBytes32(token.symbol()) != expectedSymbol
        ) revert AssetVerificationFailed(asset, expectedSymbol);
    }
}
