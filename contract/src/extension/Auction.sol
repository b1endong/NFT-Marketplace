// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {KSeaNFTMarketplace} from "../KSeaNFTMarketplace.sol";

contract AuctionModular {
    /*//////////////////////////////////////////////////////////////
                                 ERROR
    //////////////////////////////////////////////////////////////*/

    error Auction__NotSeller();
    error Auction__DurationMustBeGreaterThanZero();
    error Auction__AuctionAlreadyActive();
    error Auction__AuctionNotActive();
    error Auction__BidNotHighEnough();
    error Auction__RefundFailed();
    error Auction__NoBidPlaced();
    error Auction__NotHighestBidder();
    error Auction__NotEnded();
    error Auction__DurationMustBeLessThanMax();

    /*//////////////////////////////////////////////////////////////
                            TYPE DECLARATION
    //////////////////////////////////////////////////////////////*/

    struct Auction {
        uint256 itemId;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    KSeaNFTMarketplace private marketplace;
    uint256 private maxDurationAuction;
    mapping(uint256 => Auction) public auctions; // itemId => Auction
    mapping(uint256 => mapping(address => uint256)) public bids; // itemId => (bidder => amount) : refund mapping

    /*//////////////////////////////////////////////////////////////
                                 EVENT
    //////////////////////////////////////////////////////////////*/

    event AuctionCreated(uint256 indexed itemId, uint256 endTime);
    event AuctionBidPlaced(
        uint256 indexed itemId,
        address indexed bidder,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _marketplace, uint256 _maxDuration) {
        marketplace = KSeaNFTMarketplace(_marketplace);
        maxDurationAuction = _maxDuration;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTION
    //////////////////////////////////////////////////////////////*/

    function createAuction(uint256 itemId, uint256 duration) external {
        if (marketplace.getActiveMarketItem(itemId).seller != msg.sender) {
            revert Auction__NotSeller();
        }

        if (duration > maxDurationAuction) {
            revert Auction__DurationMustBeLessThanMax();
        }

        if (duration <= 0) {
            revert Auction__DurationMustBeGreaterThanZero();
        }

        if (auctions[itemId].isActive) {
            revert Auction__AuctionAlreadyActive();
        }

        auctions[itemId] = Auction({
            itemId: itemId,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });

        emit AuctionCreated(itemId, block.timestamp + duration);
    }

    function placeBid(uint256 itemId) external payable {
        Auction storage auction = auctions[itemId];

        if (!auction.isActive || block.timestamp >= auction.endTime) {
            revert Auction__AuctionNotActive();
        }

        if (msg.value <= auction.highestBid) {
            revert Auction__BidNotHighEnough();
        }

        // Refund the previous highest bidder
        if (auction.highestBidder != address(0)) {
            bids[itemId][auction.highestBidder] += auction.highestBid;
        }

        // Update the auction with the new highest bid
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit AuctionBidPlaced(itemId, msg.sender, msg.value);
    }

    function refundBid(uint256 itemId) external {
        uint256 amount = bids[itemId][msg.sender];
        if (amount == 0) {
            revert Auction__NoBidPlaced();
        }

        bids[itemId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert Auction__RefundFailed();
        }
    }

    function settleAuction(uint256 itemId) external {
        Auction storage auction = auctions[itemId];
        if (msg.sender != auction.highestBidder) {
            revert Auction__NotHighestBidder();
        }

        if (!auction.isActive) {
            revert Auction__AuctionNotActive();
        }

        if (block.timestamp < auction.endTime) {
            revert Auction__NotEnded();
        }

        auction.isActive = false;

        marketplace.settleAuction(
            auction.itemId,
            auction.highestBidder,
            auction.highestBid,
            address(this)
        );
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTION
    //////////////////////////////////////////////////////////////*/

    function getMarketplaceAddress() public view returns (address) {
        return address(marketplace);
    }
}
