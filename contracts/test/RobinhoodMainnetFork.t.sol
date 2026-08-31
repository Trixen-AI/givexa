// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test, console2} from "forge-std/Test.sol";
import {RobinhoodMainnetAssets} from "../script/RobinhoodMainnetAssets.sol";
import {IRobinhoodStockToken} from "../script/DeployGivexa.s.sol";

contract RobinhoodMainnetForkTest is Test {
    bool internal forkEnabled;

    function setUp() public {
        string memory rpcUrl = vm.envOr("ROBINHOOD_MAINNET_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;
        vm.createSelectFork(rpcUrl);
        forkEnabled = true;
    }

    function testFork_TenConceptAssetsHaveExpectedOnchainMetadata() public view {
        if (!forkEnabled) return;
        assertEq(block.chainid, RobinhoodMainnetAssets.CHAIN_ID);
        address[] memory assets = RobinhoodMainnetAssets.addresses();
        bytes32[] memory symbols = RobinhoodMainnetAssets.symbols();
        assertEq(assets.length, 10);
        for (uint256 i; i < assets.length; ++i) {
            assertGt(assets[i].code.length, 0);
            IRobinhoodStockToken token = IRobinhoodStockToken(assets[i]);
            assertEq(token.decimals(), 18);
            assertGt(token.uiMultiplier(), 0);
            if (RobinhoodMainnetAssets.toBytes32(token.symbol()) != symbols[i]) {
                console2.log("Symbol mismatch index", i);
                console2.log("Expected", string(abi.encodePacked(symbols[i])));
                console2.log("Actual", token.symbol());
                console2.log("Asset", assets[i]);
            }
            assertEq(RobinhoodMainnetAssets.toBytes32(token.symbol()), symbols[i]);
        }
    }
}
