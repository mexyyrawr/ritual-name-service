export const RNS_ADDRESS = (process.env.NEXT_PUBLIC_RNS_CONTRACT ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const RNS_ABI = [
  {
    type: "function",
    name: "register",
    inputs: [
      { name: "name", type: "string" },
      { name: "resolvedAddress", type: "address" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecord",
    inputs: [{ name: "name", type: "string" }],
    outputs: [
      { name: "ownerAddr", type: "address" },
      { name: "resolvedAddr", type: "address" },
      { name: "registeredAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reverseResolve",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAvailable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateAddress",
    inputs: [
      { name: "name", type: "string" },
      { name: "newResolvedAddress", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferName",
    inputs: [
      { name: "name", type: "string" },
      { name: "newOwner", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "REGISTRATION_FEE",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "NameRegistered",
    inputs: [
      { name: "nameHash", type: "bytes32", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "registrant", type: "address", indexed: true },
      { name: "resolvedAddress", type: "address", indexed: false },
    ],
  },
] as const;
