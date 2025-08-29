// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "@forge/src/Test.sol";
import {AuctionModular} from "../../src/extension/Auction.sol";
import {KSeaNFTMarketplace} from "../../src/KSeaNFTMarketplace.sol";
import {KSeaNFT} from "../../src/KSeaNFT.sol";
import {LISTING_PRICE, FEE_PERCENTAGE, MAX_DURATION_AUCTION} from "../../src/Constant.sol";

contract AuctionTest is Test {
    AuctionModular auction;
    KSeaNFTMarketplace kSeaNFTMarketplace;
    KSeaNFT kSeaNFT;
    uint256 private initialBalance = 10 ether;
    address private user = makeAddr("user");
    address private user2 = makeAddr("user2");
    address private user3 = makeAddr("user3");
    string private constant TOKEN_URI =
        "ipfs://bafybeifiphugocn3g6jsczy2xgxbbik7rshonw54j4kxnuvdfsokgxxyum";
    string private constant TOKEN_URI_2 =
        "ipfs://QmPp9Nntg9ogWzyat42kt6LJnniArk3EhPrZyMcbj4dmwQ";

    modifier listMarketItem() {
        kSeaNFT = new KSeaNFT();
        //User 1
        vm.startPrank(user);
        kSeaNFT.createToken(TOKEN_URI);
        kSeaNFT.approve(address(kSeaNFTMarketplace), 1);

        kSeaNFTMarketplace.createMarketItems{value: LISTING_PRICE}(
            address(kSeaNFT),
            1,
            0.1 ether
        );
        vm.stopPrank();

        //User 2
        vm.startPrank(user2);
        kSeaNFT.createToken(TOKEN_URI_2);
        kSeaNFT.approve(address(kSeaNFTMarketplace), 2);

        kSeaNFTMarketplace.createMarketItems{value: LISTING_PRICE}(
            address(kSeaNFT),
            2,
            1 ether
        );
        vm.stopPrank();
        _;
    }

    event AuctionCreated(uint256 indexed itemId, uint256 endTime);

    function setUp() public {
        kSeaNFTMarketplace = new KSeaNFTMarketplace(
            LISTING_PRICE,
            FEE_PERCENTAGE
        );
        auction = new AuctionModular(
            payable(address(kSeaNFTMarketplace)),
            MAX_DURATION_AUCTION
        );
        vm.deal(user, initialBalance);
        vm.deal(user2, initialBalance);
        vm.deal(user3, initialBalance);
    }

    function testSetUp() public view {
        assert(
            keccak256(abi.encodePacked(address(kSeaNFTMarketplace))) ==
                keccak256(
                    abi.encodePacked(address(auction.getMarketplaceAddress()))
                )
        );
    }

    function testAuctionCreation() public listMarketItem {
        kSeaNFTMarketplace.getAllActiveNfts();
        kSeaNFTMarketplace.getActiveMarketItem(1);

        // Create a new auction

        vm.expectEmit();
        emit AuctionCreated(1, block.timestamp + 12 hours);
        vm.prank(user);
        auction.createAuction(1, 12 hours);

        // Check that the auction was created successfully
        assertEq(auction.getAuction(1).itemId, 1);
        assertEq(auction.getAuction(1).highestBid, 0);
        assertEq(auction.getAuction(1).highestBidder, address(0));
        assertEq(auction.getAuction(1).endTime, block.timestamp + 12 hours);
        assertTrue(auction.getAuction(1).isActive);
        emit AuctionCreated(1, block.timestamp + 12 hours);
    }

    function testPlaceBid() public listMarketItem {
        vm.prank(user);
        auction.createAuction(1, 12 hours);
        kSeaNFTMarketplace.getAllActiveNfts();

        vm.prank(user2);
        auction.placeBid{value: 1 ether}(1);
        assertEq(auction.getUserRefundableAmount(1, user2), 0 ether);

        vm.prank(user3);
        auction.placeBid{value: 1.5 ether}(1);
        assertEq(auction.getUserRefundableAmount(1, user2), 1 ether);
        assertEq(auction.getUserRefundableAmount(1, user3), 0 ether);

        // vm.expectRevert("Seller cannot bid on own auction");
        // vm.prank(user);
        // auction.placeBid{value: 2 ether}(1);

        vm.prank(user2);
        auction.placeBid{value: 2.5 ether}(1);
        assertEq(auction.getUserRefundableAmount(1, user2), 0 ether);
        assertEq(auction.getUserRefundableAmount(1, user3), 1.5 ether);

        vm.prank(user3);
        auction.placeBid{value: 4 ether}(1);
        assertEq(auction.getUserRefundableAmount(1, user2), 3.5 ether);
        assertEq(auction.getUserRefundableAmount(1, user3), 0 ether);

        assertEq(auction.getAuction(1).highestBid, 5.5 ether);
        assertEq(auction.getAuction(1).highestBidder, user3);

        uint256 balance = auction.getContractBalance();
        console.log("Contract balance:", balance);
    }

    function testCheckUpkeep() public listMarketItem {
        //Check Upkeep
        (bool upkeepNeeded, ) = auction.checkUpkeep("");
        assertFalse(upkeepNeeded);

        // Auction start
        vm.prank(user);
        auction.createAuction(1, 12 hours);
        (bool upkeepNeeded2, bytes memory performData2) = auction.checkUpkeep(
            ""
        );
        assertFalse(upkeepNeeded2);

        // // Auction ended without bidders
        // vm.roll(block.number + 1);
        // vm.warp(block.timestamp + 13 hours);
        // (bool upkeepNeeded3, bytes memory performData3) = auction.checkUpkeep(
        //     ""
        // );
        // assertFalse(upkeepNeeded3);

        //Add player
        vm.prank(user2);
        auction.placeBid{value: 1 ether}(1);
        vm.prank(user3);
        auction.placeBid{value: 2 ether}(1);

        //Auction ended with bidders
        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 13 hours);
        (bool upkeepNeeded4, bytes memory performData4) = auction.checkUpkeep(
            ""
        );
        assertTrue(upkeepNeeded4);

        vm.prank(user3);
        auction.performUpkeep(performData4);
        (bool upkeepNeeded5, bytes memory performData5) = auction.checkUpkeep(
            ""
        );
        assertFalse(upkeepNeeded5);
        kSeaNFTMarketplace.getAllNfts();
    }
}
