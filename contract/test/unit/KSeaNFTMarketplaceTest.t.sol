// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "@forge/src/Test.sol";
import {KSeaNFTMarketplace} from "../../src/KSeaNFTMarketplace.sol";
import {KSeaNFT} from "../../src/KSeaNFT.sol";
import {LISTING_PRICE, FEE_PERCENTAGE} from "../../src/Constant.sol";

contract KSeaNFTMarketplaceTest is Test {
    KSeaNFTMarketplace kSeaNFTMarketplace;
    KSeaNFT kSeaNFT;
    address private owner = makeAddr("owner");
    address private user = makeAddr("user");
    address private user2 = makeAddr("user2");
    uint256 private initialBalance = 10 ether;
    string private constant TOKEN_URI =
        "ipfs://bafybeifiphugocn3g6jsczy2xgxbbik7rshonw54j4kxnuvdfsokgxxyum";
    string private constant TOKEN_URI_2 =
        "ipfs://QmPp9Nntg9ogWzyat42kt6LJnniArk3EhPrZyMcbj4dmwQ";
    string private constant TOKEN_URI_3 =
        "ipfs://bafybeig2gf5a5pyhsgz3xiphh57yje66oiw5nmqzyiw3dws2qvpnn5guiu";

    event MarketItemCreated(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        uint256 price,
        bool isSold,
        bool isCancel
    );

    event CancelListingMarketItem(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        bool isCancel
    );

    event MarketItemSale(
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address indexed nftContract,
        address payable seller,
        address payable owner,
        uint256 price,
        uint256 fee,
        bool isSold
    );

    event Withdrawals(address indexed to, uint256 amount);

    modifier listNFTs() {
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

    function setUp() public {
        vm.prank(owner);
        kSeaNFTMarketplace = new KSeaNFTMarketplace(
            LISTING_PRICE,
            FEE_PERCENTAGE
        );
        vm.deal(user, initialBalance);
        vm.deal(owner, initialBalance);
        vm.deal(user2, initialBalance);
    }

    function testMarketplaceSetUp() public view {
        assertEq(kSeaNFTMarketplace.getListingPrice(), LISTING_PRICE);
        assertEq(kSeaNFTMarketplace.getFeePercentage(), FEE_PERCENTAGE);
        assertEq(kSeaNFTMarketplace.getOwner(), owner);
    }

    function testAdminFunctions() public listNFTs {
        vm.startPrank(user);
        vm.expectRevert();
        kSeaNFTMarketplace.updateListingPrice(0.002 ether);
        vm.expectRevert();
        kSeaNFTMarketplace.updateFeePercentage(3);
        vm.stopPrank();

        vm.startPrank(owner);
        kSeaNFTMarketplace.updateListingPrice(0.002 ether);
        kSeaNFTMarketplace.updateFeePercentage(3);
        vm.stopPrank();

        assertFalse(kSeaNFTMarketplace.getListingPrice() == LISTING_PRICE);
        assertFalse(kSeaNFTMarketplace.getFeePercentage() == FEE_PERCENTAGE);

        console.log(kSeaNFTMarketplace.getPendingWithdrawals());
        vm.expectRevert();
        vm.prank(user);
        kSeaNFTMarketplace.withdraw();
        uint256 amount = kSeaNFTMarketplace.getPendingWithdrawals();
        vm.expectEmit();
        emit Withdrawals(owner, amount);
        vm.prank(owner);
        kSeaNFTMarketplace.withdraw();
        assertEq(kSeaNFTMarketplace.getPendingWithdrawals(), 0);
        assertEq(owner.balance, initialBalance + amount);
        console.log("Owner Balance:", owner.balance);
    }

    function testMarketplaceCreateMarketItem() public {
        kSeaNFT = new KSeaNFT();
        vm.startPrank(user);

        //Mint NFT 1
        kSeaNFT.createToken(TOKEN_URI);
        console.log("NFT Contract Address:", address(kSeaNFT));
        console.log("Token URI:", kSeaNFT.tokenURI(1));
        kSeaNFT.approve(address(kSeaNFTMarketplace), 1);

        //Create and List on Marketplace
        vm.expectEmit();
        emit MarketItemCreated(
            1,
            1,
            address(kSeaNFT),
            payable(user),
            payable(address(kSeaNFTMarketplace)),
            0.1 ether,
            false,
            false
        );
        kSeaNFTMarketplace.createMarketItems{value: LISTING_PRICE}(
            address(kSeaNFT),
            1,
            0.1 ether
        );
        vm.stopPrank();

        vm.startPrank(user2);

        //Mint NFT 2
        kSeaNFT.createToken(TOKEN_URI_2);
        console.log("NFT Contract Address:", address(kSeaNFT));
        console.log("Token URI:", kSeaNFT.tokenURI(2));
        kSeaNFT.approve(address(kSeaNFTMarketplace), 2);

        //Create and List on Marketplace
        kSeaNFTMarketplace.createMarketItems{value: LISTING_PRICE}(
            address(kSeaNFT),
            2,
            1 ether
        );
        vm.stopPrank();

        //Assertions
        KSeaNFTMarketplace.marketItem[] memory items = kSeaNFTMarketplace
            .getAllNfts();
        assertEq(items.length, 2);

        vm.prank(user);
        KSeaNFTMarketplace.marketItem[] memory userItems = kSeaNFTMarketplace
            .getMyNfts();
        vm.prank(user2);
        KSeaNFTMarketplace.marketItem[] memory userItems2 = kSeaNFTMarketplace
            .getMyNfts();

        assertEq(kSeaNFTMarketplace.getTokenCounter(), 2);

        // Check pending withdrawals
        assertEq(kSeaNFTMarketplace.getPendingWithdrawals(), 2 * LISTING_PRICE);
        assertEq(user.balance, initialBalance - LISTING_PRICE);
        assertEq(user2.balance, initialBalance - LISTING_PRICE);
    }

    function testCancelListingMarketItem() public listNFTs {
        vm.startPrank(user);
        kSeaNFT.createToken(TOKEN_URI_3);
        kSeaNFT.approve(address(kSeaNFTMarketplace), 3);

        kSeaNFTMarketplace.createMarketItems{value: LISTING_PRICE}(
            address(kSeaNFT),
            3,
            0.4 ether
        );
        vm.stopPrank();

        //Before Cancel
        assertEq(kSeaNFT.balanceOf(user2), 0);
        KSeaNFTMarketplace.marketItem[] memory itemsBefore = kSeaNFTMarketplace
            .getAllNfts();
        vm.prank(user2);
        KSeaNFTMarketplace.marketItem[]
            memory userItemsBefore = kSeaNFTMarketplace.getMyNfts();
        //Cancel
        vm.startPrank(user2);
        vm.expectEmit();
        emit CancelListingMarketItem(
            2,
            2,
            address(kSeaNFT),
            payable(user2),
            payable(user2),
            true
        );

        kSeaNFTMarketplace.cancelListingMarketItem(2);
        vm.stopPrank();
        //After Cancel
        assertEq(kSeaNFT.balanceOf(user2), 1);
        KSeaNFTMarketplace.marketItem[] memory itemsAfter = kSeaNFTMarketplace
            .getAllNfts();
        vm.prank(user2);
        KSeaNFTMarketplace.marketItem[]
            memory userItemsAfter = kSeaNFTMarketplace.getMyNfts();
    }

    function testBuyMarketItem() public listNFTs {
        KSeaNFTMarketplace.marketItem[] memory items = kSeaNFTMarketplace
            .getAllNfts();

        uint256 user2BeforeBalance = user2.balance;
        uint256 user1BeforeBalance = user.balance;
        vm.startPrank(user2);
        vm.expectEmit();
        emit MarketItemSale(
            items[0].itemId,
            items[0].tokenId,
            items[0].nftContract,
            payable(address(0)),
            payable(address(user2)),
            items[0].price,
            (0.1 ether * FEE_PERCENTAGE) / 100,
            true
        );
        kSeaNFTMarketplace.buyMarketItem{value: 0.1 ether}(1);
        vm.stopPrank();
        KSeaNFTMarketplace.marketItem[] memory itemsAfter = kSeaNFTMarketplace
            .getAllNfts();

        uint256 user2AfterBalance = user2.balance;
        uint256 user1AfterBalance = user.balance;

        assertEq(user2BeforeBalance - 0.1 ether, user2AfterBalance);
        assertEq(user1BeforeBalance + 0.098 ether, user1AfterBalance); //After fee
        assertEq(
            kSeaNFTMarketplace.getPendingWithdrawals(),
            2 * LISTING_PRICE + 0.002 ether
        );

        assertEq(itemsAfter[0].isSold, true);
        assertEq(itemsAfter[0].owner, user2);
        assertEq(itemsAfter[0].seller, address(0));
        assertEq(kSeaNFT.balanceOf(user2), 1);
    }
}
