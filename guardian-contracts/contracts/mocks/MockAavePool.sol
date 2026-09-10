// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Test-only aToken (6 decimals). Only its pool may mint/burn.
contract MockAToken is ERC20 {
    address public immutable pool;

    constructor() ERC20("Mock aUSDC", "aUSDC") {
        pool = msg.sender;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function poolMint(address to, uint256 amount) external {
        require(msg.sender == pool, "not pool");
        _mint(to, amount);
    }

    function poolBurn(address from, uint256 amount) external {
        require(msg.sender == pool, "not pool");
        _burn(from, amount);
    }
}

/// @dev Test-only Aave v3 Pool stand-in. supply() pulls the asset and mints aToken 1:1 to
///      `onBehalfOf`; withdraw() burns the caller's aToken 1:1 and returns the asset. No interest,
///      so local position math is exact. Real Aave addresses are used on Base Sepolia.
contract MockAavePool {
    IERC20 public immutable asset;
    MockAToken public immutable aToken;

    constructor(IERC20 _asset) {
        asset = _asset;
        aToken = new MockAToken();
    }

    function supply(address a, uint256 amount, address onBehalfOf, uint16) external {
        require(a == address(asset), "asset");
        asset.transferFrom(msg.sender, address(this), amount);
        aToken.poolMint(onBehalfOf, amount);
    }

    function withdraw(address a, uint256 amount, address to) external returns (uint256) {
        require(a == address(asset), "asset");
        aToken.poolBurn(msg.sender, amount);
        asset.transfer(to, amount);
        return amount;
    }
}
