// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockStockToken is ERC20 {
    uint256 public uiMultiplier = 1e18;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function setUiMultiplier(uint256 newMultiplier) external {
        uiMultiplier = newMultiplier;
    }
}

contract MockSixDecimalToken is MockStockToken {
    constructor() MockStockToken("Six Decimal Token", "SIX") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract MockFeeOnTransferToken is MockStockToken {
    constructor() MockStockToken("Taxed Stock", "TAX") {}

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            uint256 fee = value / 100;
            super._update(from, address(0), fee);
            super._update(from, to, value - fee);
        } else {
            super._update(from, to, value);
        }
    }
}
