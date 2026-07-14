// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RNS {
    struct Record {
        address owner;
        address resolvedAddress;
        uint256 registeredAt;
        bool exists;
    }

    // name hash => Record
    mapping(bytes32 => Record) private records;
    // address => name (reverse lookup)
    mapping(address => string) private reverseNames;
    // name hash => whether name is taken
    mapping(bytes32 => bool) private isRegistered;

    uint256 public constant REGISTRATION_FEE = 0.001 ether;
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 32;

    address public owner;

    event NameRegistered(bytes32 indexed nameHash, string name, address indexed registrant, address resolvedAddress);
    event AddressUpdated(bytes32 indexed nameHash, address indexed newAddress);
    event NameTransferred(bytes32 indexed nameHash, address indexed from, address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "RNS: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    function register(string calldata name, address resolvedAddress) external payable {
        require(bytes(name).length >= MIN_NAME_LENGTH, "RNS: name too short");
        require(bytes(name).length <= MAX_NAME_LENGTH, "RNS: name too long");
        require(_isValidName(name), "RNS: invalid chars (a-z0-9 only)");
        require(msg.value >= REGISTRATION_FEE, "RNS: insufficient fee");

        bytes32 nameHash = _nameHash(name);
        require(!isRegistered[nameHash], "RNS: name taken");

        records[nameHash] = Record({
            owner: msg.sender,
            resolvedAddress: resolvedAddress,
            registeredAt: block.timestamp,
            exists: true
        });
        isRegistered[nameHash] = true;
        reverseNames[msg.sender] = name;

        emit NameRegistered(nameHash, name, msg.sender, resolvedAddress);

        // Refund excess
        if (msg.value > REGISTRATION_FEE) {
            (bool sent, ) = payable(msg.sender).call{value: msg.value - REGISTRATION_FEE}("");
            require(sent, "RNS: refund failed");
        }
    }

    function resolve(string calldata name) external view returns (address) {
        bytes32 nameHash = _nameHash(name);
        require(records[nameHash].exists, "RNS: name not found");
        return records[nameHash].resolvedAddress;
    }

    function getRecord(string calldata name) external view returns (
        address ownerAddr,
        address resolvedAddr,
        uint256 registeredAt
    ) {
        bytes32 nameHash = _nameHash(name);
        Record storage r = records[nameHash];
        require(r.exists, "RNS: name not found");
        return (r.owner, r.resolvedAddress, r.registeredAt);
    }

    function reverseResolve(address addr) external view returns (string memory) {
        string memory name = reverseNames[addr];
        require(bytes(name).length > 0, "RNS: no reverse record");
        return name;
    }

    function isAvailable(string calldata name) external view returns (bool) {
        return !isRegistered[_nameHash(name)];
    }

    // ============ Management Functions ============

    function updateAddress(string calldata name, address newResolvedAddress) external {
        bytes32 nameHash = _nameHash(name);
        Record storage r = records[nameHash];
        require(r.exists, "RNS: name not found");
        require(r.owner == msg.sender, "RNS: not owner");

        r.resolvedAddress = newResolvedAddress;
        emit AddressUpdated(nameHash, newResolvedAddress);
    }

    function transferName(string calldata name, address newOwner) external {
        bytes32 nameHash = _nameHash(name);
        Record storage r = records[nameHash];
        require(r.exists, "RNS: name not found");
        require(r.owner == msg.sender, "RNS: not owner");

        // Clear old reverse record
        delete reverseNames[msg.sender];

        r.owner = newOwner;
        reverseNames[newOwner] = name;

        emit NameTransferred(nameHash, msg.sender, newOwner);
    }

    // ============ Admin Functions ============

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "RNS: no balance");
        (bool sent, ) = payable(owner).call{value: balance}("");
        require(sent, "RNS: withdraw failed");
    }

    // ============ Internal Functions ============

    function _nameHash(string calldata name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_toLowerCase(name)));
    }

    function _isValidName(string calldata name) internal pure returns (bool) {
        for (uint256 i = 0; i < bytes(name).length; i++) {
            bytes1 c = bytes(name)[i];
            if (
                !(c >= 0x30 && c <= 0x39) && // 0-9
                !(c >= 0x61 && c <= 0x7a) && // a-z
                !(c >= 0x41 && c <= 0x5a) && // A-Z
                c != 0x2d && // -
                c != 0x5f    // _
            ) {
                return false;
            }
        }
        return true;
    }

    function _toLowerCase(string calldata s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        for (uint256 i = 0; i < b.length; i++) {
            if (uint8(b[i]) >= 0x41 && uint8(b[i]) <= 0x5A) {
                b[i] = bytes1(uint8(b[i]) + 32);
            }
        }
        return string(b);
    }

    receive() external payable {}
}
