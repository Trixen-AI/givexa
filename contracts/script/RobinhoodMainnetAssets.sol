// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

library RobinhoodMainnetAssets {
    uint256 internal constant CHAIN_ID = 4663;
    uint256 internal constant ASSET_COUNT = 10;

    function addresses() internal pure returns (address[] memory values) {
        values = new address[](ASSET_COUNT);
        values[0] = 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC; // NVDA
        values[1] = 0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9; // AAPL
        values[2] = 0x322F0929c4625eD5bAd873c95208D54E1c003b2d; // TSLA
        values[3] = 0xe93237C50D904957Cf27E7B1133b510C669c2e74; // MSFT
        values[4] = 0x12f190a9F9d7D37a250758b26824B97CE941bF54; // AMZN
        values[5] = 0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3; // GOOGL
        values[6] = 0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35; // META
        values[7] = 0x117cc2133c37B721F49dE2A7a74833232B3B4C0C; // SPY
        values[8] = 0xD5f3879160bc7c32ebb4dC785F8a4F505888de68; // QQQ
        values[9] = 0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e; // GLD
    }

    function symbols() internal pure returns (bytes32[] memory values) {
        values = new bytes32[](ASSET_COUNT);
        values[0] = toBytes32("NVDA");
        values[1] = toBytes32("AAPL");
        values[2] = toBytes32("TSLA");
        values[3] = toBytes32("MSFT");
        values[4] = toBytes32("AMZN");
        values[5] = toBytes32("GOOGL");
        values[6] = toBytes32("META");
        values[7] = toBytes32("SPY");
        values[8] = toBytes32("QQQ");
        values[9] = toBytes32("GLD");
    }

    function toBytes32(string memory value) internal pure returns (bytes32 result) {
        bytes memory data = bytes(value);
        if (data.length == 0 || data.length > 32) return bytes32(0);
        assembly ("memory-safe") {
            result := mload(add(data, 32))
        }
    }
}
