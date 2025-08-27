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
    uint256 private auctionCounter;
    mapping(uint256 => Auction) private auctions; // itemId => Auction
    mapping(uint256 => mapping(address => uint256)) private refunds; // itemId => (bidder => amount) : refund mapping
    mapping(uint256 => mapping(address => uint256)) private bids; // itemId => (bidder => amount) : bid mapping

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
        auctionCounter++;

        emit AuctionCreated(itemId, block.timestamp + duration);
    }

    function placeBid(uint256 itemId) external payable {
        Auction storage auction = auctions[itemId];
        if (!auction.isActive || block.timestamp >= auction.endTime) {
            revert Auction__AuctionNotActive();
        }

        if (msg.value < marketplace.getActiveMarketItem(itemId).price) {
            revert Auction__BidNotHighEnough();
        }

        if (msg.value <= auction.highestBid) {
            revert Auction__BidNotHighEnough();
        }

        require(
            msg.sender != marketplace.getActiveMarketItem(itemId).seller,
            "Seller cannot bid on own auction"
        );

        if (msg.sender != address(0)) {
            bids[itemId][msg.sender] += msg.value;
        }

        if (bids[itemId][msg.sender] > auction.highestBid) {
            refunds[itemId][auction.highestBidder] = auction.highestBid;
            refunds[itemId][msg.sender] = 0;
            auction.highestBid = bids[itemId][msg.sender];
            auction.highestBidder = msg.sender;
        }

        // // // Refund the previous highest bidder
        // // if (auction.highestBidder != address(0)) {
        // //     bids[itemId][auction.highestBidder] += auction.highestBid;
        // // }

        // // Update the auction with the new highest bid
        // auction.highestBid = msg.value;
        // auction.highestBidder = msg.sender;

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
        auctionCounter--;
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTION
    //////////////////////////////////////////////////////////////*/

    function getMarketplaceAddress() public view returns (address) {
        return address(marketplace);
    }

    function getAllAuctions() public view returns (Auction[] memory) {
        Auction[] memory allAuctions = new Auction[](auctionCounter);
        for (uint256 i = 0; i < auctionCounter; i++) {
            allAuctions[i] = auctions[i];
        }
        return allAuctions;
    }

    function getAuction(uint256 itemId) public view returns (Auction memory) {
        return auctions[itemId];
    }

    function getUserRefundableAmount(
        uint256 itemId,
        address user
    ) public view returns (uint256) {
        return refunds[itemId][user];
    }
}
