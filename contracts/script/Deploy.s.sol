// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {RNS} from "../src/RNS.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        RNS rns = new RNS();
        console.log("RNS deployed to:", address(rns));

        vm.stopBroadcast();
    }
}
