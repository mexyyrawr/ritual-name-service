# 🔮 RNS — Ritual Name Service

Register human-readable names on Ritual Chain. Send RITUAL by name instead of pasting 42-char addresses.

Like ENS/SNS, but for Ritual Chain (Chain ID 1979).

## Features

- **Register** — Pay 0.01 RITUAL to claim a unique name (3-32 chars)
- **Resolve** — Look up any `.ritual` name → get the address
- **Send by Name** — Transfer RITUAL by typing a name, not an address
- **Reverse Lookup** — See what name an address owns
- **Update/Transfer** — Change your resolved address or transfer ownership

## Project Structure

```
ritual-name-service/
├── contracts/          # Foundry (Solidity)
│   ├── src/RNS.sol     # Main contract
│   ├── test/RNS.t.sol  # 16 passing tests
│   └── script/         # Deploy script
└── frontend/           # Next.js + wagmi
    ├── app/            # Pages & layout
    ├── components/     # UI components
    └── lib/            # Chain config, ABI, wagmi
```

## Quick Start

### 1. Deploy Contract

```bash
cd contracts
export PRIVATE_KEY=0x...
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org
forge script script/Deploy.s.sol:DeployScript --rpc-url $RITUAL_RPC_URL --broadcast -vvvv
```

### 2. Run Frontend

```bash
cd frontend
# Set contract address from deploy output
echo "NEXT_PUBLIC_RNS_CONTRACT=0x..." > .env.local
echo "NEXT_PUBLIC_RITUAL_RPC_URL=https://rpc.ritualfoundation.org" >> .env.local
npm run dev
```

### 3. Verify Contract

```bash
forge verify-contract --chain 1979 --watch \
  --verifier custom \
  --verifier-url "https://rpc.ritualfoundation.org/api/verify" \
  --verifier-api-key unused \
  0xYOUR_CONTRACT src/RNS.sol:RNS
```

## Contract API

| Function | Description |
|----------|-------------|
| `register(name, address)` | Register name → address mapping (0.01 RITUAL) |
| `resolve(name)` | Get address for a name |
| `getRecord(name)` | Get full record (owner, address, timestamp) |
| `reverseResolve(address)` | Get name owned by an address |
| `isAvailable(name)` | Check if a name is available |
| `updateAddress(name, addr)` | Update resolved address (owner only) |
| `transferName(name, addr)` | Transfer name ownership (owner only) |

## Built With

- **Solidity 0.8.20** — Smart contract
- **Foundry** — Build, test, deploy
- **Next.js 14** — Frontend
- **wagmi v2 + viem** — Web3 hooks
- **Tailwind CSS** — Styling
- **Ritual Chain** — Chain ID 1979
