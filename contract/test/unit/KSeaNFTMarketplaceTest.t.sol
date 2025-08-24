// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "@forge/src/Test.sol";
import {KSeaNFTMarketplace} from "../../src/KSeaNFTMarketplace.sol";
import {LISTING_PRICE, FEE_PERCENTAGE} from "../../src/Constant.sol";

contract KSeaNFTMarketplaceTest is Test {
    KSeaNFTMarketplace kSeaNFTMarketplace;
    address private owner = makeAddr("owner");
    address private user = makeAddr("user");

    function setUp() public {
        vm.prank(owner);
        kSeaNFTMarketplace = new KSeaNFTMarketplace(
            LISTING_PRICE,
            FEE_PERCENTAGE
        );
    }

    function testMarketplaceSetUp() public view {
        assertEq(kSeaNFTMarketplace.getListingPrice(), LISTING_PRICE);
        assertEq(kSeaNFTMarketplace.getFeePercentage(), FEE_PERCENTAGE);
        assertEq(kSeaNFTMarketplace.getOwner(), owner);
    }

    function testAdminFunctions() public {
        vm.startPrank(user);
        vm.expectRevert("Only Owner can call this function");
        kSeaNFTMarketplace.updateListingPrice(0.002 ether);
        vm.expectRevert("Only Owner can call this function");
        kSeaNFTMarketplace.updateFeePercentage(3);
        vm.stopPrank();

        vm.startPrank(owner);
        kSeaNFTMarketplace.updateListingPrice(0.002 ether);
        kSeaNFTMarketplace.updateFeePercentage(3);
        vm.stopPrank();

        assertFalse(kSeaNFTMarketplace.getListingPrice() == LISTING_PRICE);
        assertFalse(kSeaNFTMarketplace.getFeePercentage() == FEE_PERCENTAGE);
    }
}
