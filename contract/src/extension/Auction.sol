// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {KSeaNFTMarketplace} from "../KSeaNFTMarketplace.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

contract AuctionModular is AutomationCompatibleInterface {
    /*//////////////////////////////////////////////////////////////
                                 ERROR
    //////////////////////////////////////////////////////////////*/

    error Auction__NotSeller();
    error Auction__DurationMustBeGreaterThanZero();
    error Auction__AuctionAlreadyActive();
    error Auction__AuctionNotActive();
    error Auction__BidNotHighEnough();
    error Auction__InvalidBidder();
    error Auction__AlreadyHighestBidder();
    error Auction__RefundFailed();
    error Auction__NoBidPlaced();
    error Auction__NotHighestBidder();
    error Auction__NotEnded();
    error Auction__DurationMustBeLessThanMax();
    error Auction__TransferFailed();
    error Auction__NftTransferFailed();

    /*//////////////////////////////////////////////////////////////
                            TYPE DECLARATION
    //////////////////////////////////////////////////////////////*/

    struct Auction {
        uint256 itemId;
        address owner;
        uint256 startingBid;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    KSeaNFTMarketplace private marketplace;
    uint256 private auctionCounter;
    uint256 public maxDuration;
    mapping(uint256 => Auction) private auctions; // itemId => Auction
    mapping(uint256 => mapping(address => uint256)) private refunds; // itemId => (bidder => amount) : refund mapping
    mapping(uint256 => mapping(address => uint256)) private bids; // itemId => (bidder => amount) : bid mapping

    /*//////////////////////////////////////////////////////////////
                                 EVENT
    //////////////////////////////////////////////////////////////*/

    event AuctionCreated(
        uint256 indexed itemId,
        address owner,
        uint256 endTime
    );
    event AuctionBidPlaced(
        uint256 indexed itemId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        uint256 indexed itemId,
        address indexed winner,
        address owner,
        uint256 amount,
        uint256 fee
    );

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address payable _marketplace, uint256 _maxDuration) {
        marketplace = KSeaNFTMarketplace(_marketplace);
        maxDuration = _maxDuration;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTION
    //////////////////////////////////////////////////////////////*/

    function createAuction(uint256 itemId, uint256 duration) external {
        if (marketplace.getActiveMarketItem(itemId).seller != msg.sender) {
            revert Auction__NotSeller();
        }

        if (duration <= 0) {
            revert Auction__DurationMustBeGreaterThanZero();
        }

        if (duration > maxDuration) {
            revert Auction__DurationMustBeLessThanMax();
        }

        if (auctions[itemId].isActive) {
            revert Auction__AuctionAlreadyActive();
        }

        auctions[itemId] = Auction({
            itemId: itemId,
            owner: msg.sender,
            startingBid: marketplace.getActiveMarketItem(itemId).price,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });
        auctionCounter++;

        emit AuctionCreated(itemId, msg.sender, block.timestamp + duration);
    }

    function placeBid(uint256 itemId) external payable {
        Auction storage a = auctions[itemId];
        if (!a.isActive || block.timestamp >= a.endTime) {
            revert Auction__AuctionNotActive();
        }

        if (msg.value < a.startingBid || msg.value <= a.highestBid) {
            revert Auction__BidNotHighEnough();
        }

        if (msg.sender == marketplace.getActiveMarketItem(itemId).seller) {
            revert Auction__InvalidBidder();
        }

        if (msg.sender == a.highestBidder) {
            revert Auction__AlreadyHighestBidder();
        }

        if (msg.sender != address(0)) {
            bids[itemId][msg.sender] += msg.value;
        }

        if (bids[itemId][msg.sender] > a.highestBid) {
            refunds[itemId][a.highestBidder] = a.highestBid;
            refunds[itemId][msg.sender] = 0;
            a.highestBid = bids[itemId][msg.sender];
            a.highestBidder = msg.sender;
        }

        emit AuctionBidPlaced(itemId, msg.sender, msg.value);
    }

    function refundBid(uint256 itemId) external {
        uint256 amount = refunds[itemId][msg.sender];
        if (amount == 0) {
            revert Auction__NoBidPlaced();
        }

        refunds[itemId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert Auction__RefundFailed();
        }
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory expiredAuctions = new uint256[](auctionCounter);
        uint256 index;
        for (uint256 i = 1; i <= auctionCounter; i++) {
            if (
                block.timestamp >= auctions[i].endTime &&
                auctions[i].highestBidder != address(0) &&
                auctions[i].isActive &&
                auctions[i].highestBid > 0
            ) {
                expiredAuctions[index] = auctions[i].itemId;
                index++;
            }
        }
        upkeepNeeded = index > 0;
        performData = abi.encode(expiredAuctions);
    }

    function settleAuction(uint256 itemId) external {
        Auction storage a = auctions[itemId];

        if (!a.isActive) {
            revert Auction__AuctionNotActive();
        }

        if (block.timestamp < a.endTime) {
            revert Auction__NotEnded();
        }

        if (a.highestBidder == address(0)) {
            // không có bid -> kết thúc đấu giá
            a.isActive = false;
            emit AuctionSettled(itemId, a.owner, address(0), 0, 0);
            return;
        }
        uint256 feePercentage = marketplace.getFeePercentage();
        uint fee = (a.highestBid * feePercentage) / 100;
        uint256 transferProcess = a.highestBid - fee;

        //Trả seller
        (bool success1, ) = payable(a.owner).call{value: transferProcess}("");
        if (!success1) {
            revert Auction__TransferFailed();
        }

        //Trả fee cho marketplace
        (bool success2, ) = payable(address(marketplace)).call{value: fee}("");
        if (!success2) {
            revert Auction__TransferFailed();
        }

        a.isActive = false;
        try
            marketplace.transferNftToWinner(
                a.itemId,
                a.highestBidder,
                a.highestBid,
                fee
            )
        {
            auctionCounter--;
            emit AuctionSettled(
                a.itemId,
                a.highestBidder,
                a.owner,
                a.highestBid,
                fee
            );
        } catch {
            revert Auction__NftTransferFailed();
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory expiredAuctions = abi.decode(performData, (uint256[]));

        for (uint256 i = 0; i < expiredAuctions.length; i++) {
            uint256 itemId = expiredAuctions[i];
            this.settleAuction(itemId);
        }
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

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
