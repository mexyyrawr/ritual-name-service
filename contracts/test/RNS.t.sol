// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {RNS} from "../src/RNS.sol";

contract RNSTest is Test {
    RNS rns;
    address deployer = makeAddr("deployer");
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");

    function setUp() public {
        vm.prank(deployer);
        rns = new RNS();
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(deployer, 10 ether);
    }

    function test_RegisterName() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        address resolved = rns.resolve("tuann");
        assertEq(resolved, user1);
    }

    function test_RegisterName_CaseInsensitive() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("TuanN", user1);

        // Should resolve with any case
        address resolved = rns.resolve("tuann");
        assertEq(resolved, user1);

        resolved = rns.resolve("TUANN");
        assertEq(resolved, user1);
    }

    function test_RegisterName_Taken() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        vm.prank(user2);
        vm.expectRevert("RNS: name taken");
        rns.register{value: 0.01 ether}("tuann", user2);
    }

    function test_RegisterName_TooShort() public {
        vm.prank(user1);
        vm.expectRevert("RNS: name too short");
        rns.register{value: 0.01 ether}("ab", user1);
    }

    function test_RegisterName_InsufficientFee() public {
        vm.prank(user1);
        vm.expectRevert("RNS: insufficient fee");
        rns.register{value: 0.005 ether}("tuann", user1);
    }

    function test_Resolve_NotFound() public {
        vm.expectRevert("RNS: name not found");
        rns.resolve("nonexistent");
    }

    function test_ReverseResolve() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        string memory name = rns.reverseResolve(user1);
        assertEq(keccak256(abi.encodePacked(name)), keccak256(abi.encodePacked("tuann")));
    }

    function test_UpdateAddress() public {
        vm.startPrank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);
        rns.updateAddress("tuann", user2);
        vm.stopPrank();

        address resolved = rns.resolve("tuann");
        assertEq(resolved, user2);
    }

    function test_UpdateAddress_NotOwner() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        vm.prank(user2);
        vm.expectRevert("RNS: not owner");
        rns.updateAddress("tuann", user2);
    }

    function test_TransferName() public {
        vm.startPrank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);
        rns.transferName("tuann", user2);
        vm.stopPrank();

        (address ownerAddr, , ) = rns.getRecord("tuann");
        assertEq(ownerAddr, user2);

        // Reverse should update
        string memory name = rns.reverseResolve(user2);
        assertEq(keccak256(abi.encodePacked(name)), keccak256(abi.encodePacked("tuann")));
    }

    function test_IsAvailable() public {
        assertTrue(rns.isAvailable("tuann"));

        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        assertFalse(rns.isAvailable("tuann"));
    }

    function test_GetRecord() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        (address ownerAddr, address resolvedAddr, uint256 registeredAt) = rns.getRecord("tuann");
        assertEq(ownerAddr, user1);
        assertEq(resolvedAddr, user1);
        assertGt(registeredAt, 0);
    }

    function test_Withdraw() public {
        vm.prank(user1);
        rns.register{value: 0.01 ether}("tuann", user1);

        uint256 balanceBefore = deployer.balance;
        vm.prank(deployer);
        rns.withdraw();
        uint256 balanceAfter = deployer.balance;

        assertEq(balanceAfter - balanceBefore, 0.01 ether);
    }

    function test_Withdraw_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert("RNS: not owner");
        rns.withdraw();
    }

    function test_RefundExcess() public {
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        rns.register{value: 0.05 ether}("tuann", user1);
        uint256 balanceAfter = user1.balance;

        // Should only charge 0.01, refund 0.04
        assertEq(balanceBefore - balanceAfter, 0.01 ether);
    }

    function test_InvalidNameChars() public {
        vm.prank(user1);
        vm.expectRevert("RNS: invalid chars (a-z0-9 only)");
        rns.register{value: 0.01 ether}("tuann!", user1);
    }
}
