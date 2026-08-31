// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

interface IGivexaAssetRegistryV1 {
    struct AssetConfig {
        bool registered;
        bool supported;
        bytes32 symbol;
        bytes32 provenanceHash;
    }

    function isSupported(address asset) external view returns (bool);
    function assetConfig(address asset) external view returns (AssetConfig memory);
}
