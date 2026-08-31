// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

interface IGivexaFeeControllerV1 {
    function feeBps() external view returns (uint16);
    function treasury() external view returns (address);
    function quoteFee(uint256 principal) external view returns (uint256);
}
