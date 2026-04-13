// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceOracle
 * @notice Integrates Chainlink Price Feeds for accurate asset pricing
 * @dev Replace mock pricing with real oracle data
 */
contract PriceOracle {
    // Price feed addresses for Polygon mainnet
    // See: https://docs.chain.link/data-feeds/price-feeds/addresses
    mapping(address => address) public priceFeeds;
    
    address public owner;
    
    // Events
    event PriceFeedAdded(address indexed token, address indexed priceFeed);
    event PriceFeedRemoved(address indexed token);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "PriceOracle: not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Get the latest price for a token
     * @param token Address of the token
     * @return price Price with 18 decimals
     * @return timestamp Last update timestamp
     */
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        require(priceFeeds[token] != address(0), "PriceOracle: no price feed");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        
        (
            uint80 roundID,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        // Validate round data
        require(answer > 0, "PriceOracle: invalid price");
        require(updatedAt >= block.timestamp - 1 hours, "PriceOracle: stale price");
        require(answeredInRound >= roundID, "PriceOracle: incomplete round");
        
        // Normalize to 18 decimals
        uint8 decimals = priceFeed.decimals();
        price = uint256(answer) * 10**(18 - decimals);
        timestamp = updatedAt;
        
        return (price, timestamp);
    }
    
    /**
     * @notice Get price with staleness check
     * @param token Token address
     * @param maxStaleness Maximum acceptable age in seconds
     */
    function getValidatedPrice(address token, uint256 maxStaleness) external view returns (uint256) {
        require(priceFeeds[token] != address(0), "PriceOracle: no price feed");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[token]);
        
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();
        
        require(answer > 0, "PriceOracle: invalid price");
        require(block.timestamp - updatedAt <= maxStaleness, "PriceOracle: price too old");
        
        uint8 decimals = priceFeed.decimals();
        return uint256(answer) * 10**(18 - decimals);
    }
    
    /**
     * @notice Add or update a price feed
     * @param token Token address
     * @param priceFeed Chainlink price feed address
     */
    function addPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "PriceOracle: zero token");
        require(priceFeed != address(0), "PriceOracle: zero feed");
        
        // Validate it's a valid aggregator
        AggregatorV3Interface aggregator = AggregatorV3Interface(priceFeed);
        (, int256 answer, , , ) = aggregator.latestRoundData();
        require(answer > 0, "PriceOracle: invalid feed");
        
        priceFeeds[token] = priceFeed;
        emit PriceFeedAdded(token, priceFeed);
    }
    
    /**
     * @notice Remove a price feed
     */
    function removePriceFeed(address token) external onlyOwner {
        require(priceFeeds[token] != address(0), "PriceOracle: feed not found");
        delete priceFeeds[token];
        emit PriceFeedRemoved(token);
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PriceOracle: zero address");
        owner = newOwner;
    }
}
