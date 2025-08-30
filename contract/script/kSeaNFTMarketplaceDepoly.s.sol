// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "@forge/src/Script.sol";
import {KSeaNFTMarketplace} from "../src/KSeaNFTMarketplace.sol";
import {FEE_PERCENTAGE, LISTING_PRICE, MAX_DURATION_AUCTION} from "../src/Constant.sol";
import {AuctionModular} from "../src/extension/Auction.sol";

contract kSeaNFTMarketplaceDeploy is Script {
    KSeaNFTMarketplace private kSeaNFTMarketplace;
    AuctionModular private auction;

    function run() external {
        vm.startBroadcast();
        //Deploy marketplace
        kSeaNFTMarketplace = new KSeaNFTMarketplace(
            LISTING_PRICE,
            FEE_PERCENTAGE
        );
        //Deploy Auction
        auction = new AuctionModular(
            payable(address(kSeaNFTMarketplace)),
            MAX_DURATION_AUCTION
        );
        vm.stopBroadcast();
    }
}
