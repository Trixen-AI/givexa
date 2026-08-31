// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IGivexaFeeControllerV1} from "./interfaces/IGivexaFeeControllerV1.sol";

/// @title GivexaFeeControllerV1
/// @notice Stores the sender-paid creation fee and treasury destination.
contract GivexaFeeControllerV1 is Ownable, IGivexaFeeControllerV1 {
    error ZeroAddress();
    error FeeAboveCap(uint16 requested, uint16 maximum);

    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_FEE_BPS = 100;
    uint16 public constant INITIAL_FEE_BPS = 50;
    uint16 public feeBps;
    address public treasury;

    event FeeBpsChanged(uint16 oldFeeBps, uint16 newFeeBps);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);

    constructor(address initialOwner, address initialTreasury) Ownable(initialOwner) {
        if (initialOwner == address(0) || initialTreasury == address(0)) revert ZeroAddress();
        feeBps = INITIAL_FEE_BPS;
        treasury = initialTreasury;
        emit FeeBpsChanged(0, INITIAL_FEE_BPS);
        emit TreasuryChanged(address(0), initialTreasury);
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeAboveCap(newFeeBps, MAX_FEE_BPS);
        uint16 oldFeeBps = feeBps;
        feeBps = newFeeBps;
        emit FeeBpsChanged(oldFeeBps, newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryChanged(oldTreasury, newTreasury);
    }

    function quoteFee(uint256 principal) external view returns (uint256) {
        return Math.mulDiv(principal, feeBps, BPS_DENOMINATOR);
    }
}
