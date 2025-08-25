// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "@forge/src/Script.sol";
import {KSeaNFT} from "../src/KSeaNFT.sol";

contract DeployKSeaNFT is Script {
    function run() external {
        vm.startBroadcast();
        new KSeaNFT();
        vm.stopBroadcast();
    }
}
