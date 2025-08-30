// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "@forge/src/Script.sol";
import {KSeaNFT} from "../src/KSeaNFT.sol";

contract KSeaNFTDeploy is Script {
    KSeaNFT private kSeaNFT;

    function run() external returns (KSeaNFT) {
        vm.startBroadcast();
        kSeaNFT = new KSeaNFT();
        vm.stopBroadcast();
        return kSeaNFT;
    }
}
