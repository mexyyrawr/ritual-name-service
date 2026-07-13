"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 rounded-lg bg-ritual-card border border-ritual-border text-sm hover:border-ritual-accent transition-colors"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="px-4 py-2 rounded-lg bg-ritual-accent text-white text-sm font-medium hover:bg-purple-600 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
