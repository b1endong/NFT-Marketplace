// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {KSeaNFT} from "../../src/KSeaNFT.sol";
import {KSeaNFTDeploy} from "../../script/KSeaNFTDeploy.s.sol";

contract KSeaNFTIntegrationTest is Test {
    KSeaNFT private kSeaNFT;
    KSeaNFTDeploy private deployer;
    string private constant NFT_NAME = "KSEA";
    string private constant NFT_SYMBOL = "KS";
    string private constant TOKEN_URI =
        "ipfs://bafybeifiphugocn3g6jsczy2xgxbbik7rshonw54j4kxnuvdfsokgxxyumQmZgK231zJfkn6XtwKFs2G4TgssqX92ab6WUw7CeAMy7eA";
    address private user = makeAddr("user");

    function setUp() public {
        deployer = new KSeaNFTDeploy();
        kSeaNFT = deployer.run();
    }

    function testSetUp() public view {
        assert(
            keccak256(abi.encodePacked(kSeaNFT.name())) ==
                keccak256(abi.encodePacked(NFT_NAME))
        );
        assert(
            keccak256(abi.encodePacked(kSeaNFT.symbol())) ==
                keccak256(abi.encodePacked(NFT_SYMBOL))
        );
    }

    function testCreateToken() public {
        vm.prank(user);
        uint256 tokenId = kSeaNFT.createToken(TOKEN_URI);
        assertEq(user, kSeaNFT.ownerOf(tokenId));
        assertEq(kSeaNFT.balanceOf(user), 1);
        assertEq(tokenId, 1);
        assertEq(kSeaNFT.tokenURI(tokenId), TOKEN_URI);
    }
}
