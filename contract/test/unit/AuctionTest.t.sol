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
            address(kSeaNFTMarketplace),
            MAX_DURATION_AUCTION
        );
        vm.deal(user, initialBalance);
        vm.deal(user2, initialBalance);
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
        (
            uint256 itemId,
            uint256 highestBid,
            address highestBidder,
            uint256 endTime,
            bool isActive
        ) = auction.auctions(1);
        assertEq(itemId, 1);
        assertEq(highestBid, 0);
        assertEq(highestBidder, address(0));
        assertEq(endTime, block.timestamp + 12 hours);
        assertTrue(isActive);
        emit AuctionCreated(1, block.timestamp + 12 hours);
    }
}
