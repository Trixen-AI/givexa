// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IGivexaAssetRegistryV1} from "./interfaces/IGivexaAssetRegistryV1.sol";

/// @title GivexaAssetRegistryV1
/// @notice Timelock-governed allowlist for Robinhood Chain Stock Tokens.
contract GivexaAssetRegistryV1 is Ownable, IGivexaAssetRegistryV1 {
    error ZeroAddress();
    error EmptySymbol();
    error NotAContract(address asset);
    error UnsupportedDecimals(address asset, uint8 decimals);
    error AssetAlreadyRegistered(address asset);
    error AssetNotRegistered(address asset);
    error ArrayLengthMismatch();

    uint8 public constant REQUIRED_DECIMALS = 18;
    mapping(address asset => AssetConfig config) private _assets;

    event AssetRegistered(address indexed asset, bytes32 indexed symbol, bytes32 provenanceHash);
    event AssetSupportChanged(address indexed asset, bool supported);
    event AssetProvenanceChanged(address indexed asset, bytes32 oldHash, bytes32 newHash);

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    function registerAsset(address asset, bytes32 symbol, bytes32 provenanceHash) external onlyOwner {
        _registerAsset(asset, symbol, provenanceHash);
    }

    function registerAssets(address[] calldata assets, bytes32[] calldata symbols, bytes32[] calldata provenanceHashes)
        external
        onlyOwner
    {
        uint256 length = assets.length;
        if (length != symbols.length || length != provenanceHashes.length) revert ArrayLengthMismatch();
        for (uint256 i; i < length; ++i) {
            _registerAsset(assets[i], symbols[i], provenanceHashes[i]);
        }
    }

    function setSupported(address asset, bool supported) external onlyOwner {
        AssetConfig storage config = _assets[asset];
        if (!config.registered) revert AssetNotRegistered(asset);
        if (config.supported == supported) return;
        config.supported = supported;
        emit AssetSupportChanged(asset, supported);
    }

    function setProvenanceHash(address asset, bytes32 provenanceHash) external onlyOwner {
        AssetConfig storage config = _assets[asset];
        if (!config.registered) revert AssetNotRegistered(asset);
        bytes32 oldHash = config.provenanceHash;
        config.provenanceHash = provenanceHash;
        emit AssetProvenanceChanged(asset, oldHash, provenanceHash);
    }

    function isSupported(address asset) external view returns (bool) {
        return _assets[asset].supported;
    }

    function assetConfig(address asset) external view returns (AssetConfig memory) {
        return _assets[asset];
    }

    function _registerAsset(address asset, bytes32 symbol, bytes32 provenanceHash) internal {
        if (asset == address(0)) revert ZeroAddress();
        if (symbol == bytes32(0)) revert EmptySymbol();
        if (asset.code.length == 0) revert NotAContract(asset);
        if (_assets[asset].registered) revert AssetAlreadyRegistered(asset);
        uint8 decimals = IERC20Metadata(asset).decimals();
        if (decimals != REQUIRED_DECIMALS) revert UnsupportedDecimals(asset, decimals);
        _assets[asset] = AssetConfig(true, true, symbol, provenanceHash);
        emit AssetRegistered(asset, symbol, provenanceHash);
        emit AssetSupportChanged(asset, true);
    }
}
