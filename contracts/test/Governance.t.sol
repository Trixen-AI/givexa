// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {GivexaFeeControllerV1} from "../src/GivexaFeeControllerV1.sol";

contract GovernanceTest is Test {
    function test_TwoDayDelayControlsFeeChanges() public {
        address safe = makeAddr("two-of-three-safe");
        address executor = makeAddr("permissionless-executor");
        address[] memory proposers = new address[](1);
        proposers[0] = safe;
        address[] memory executors = new address[](1);
        executors[0] = address(0);
        TimelockController timelock = new TimelockController(48 hours, proposers, executors, address(0));
        GivexaFeeControllerV1 fees = new GivexaFeeControllerV1(address(timelock), makeAddr("treasury"));

        bytes memory data = abi.encodeCall(GivexaFeeControllerV1.setFeeBps, (75));
        bytes32 predecessor;
        bytes32 salt = keccak256("fee-change-1");

        vm.prank(safe);
        timelock.schedule(address(fees), 0, data, predecessor, salt, 48 hours);

        vm.prank(executor);
        vm.expectRevert();
        timelock.execute(address(fees), 0, data, predecessor, salt);

        vm.warp(block.timestamp + 48 hours);
        vm.prank(executor);
        timelock.execute(address(fees), 0, data, predecessor, salt);
        assertEq(fees.feeBps(), 75);
    }
}
