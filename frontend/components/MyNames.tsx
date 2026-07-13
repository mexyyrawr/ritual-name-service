"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { RNS_ADDRESS, RNS_ABI } from "@/lib/contract";
import { isAddress } from "viem";

export function MyNames() {
  const { address } = useAccount();

  const { data: myName } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "reverseResolve",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: record } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "getRecord",
    args: myName ? [myName] : undefined,
    query: { enabled: !!myName },
  });

  const [newAddr, setNewAddr] = useState("");
  const [showUpdate, setShowUpdate] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!address) {
    return (
      <div className="p-6 rounded-xl bg-ritual-card border border-ritual-border text-center text-gray-400">
        Connect wallet to see your names
      </div>
    );
  }

  if (!myName) {
    return (
      <div className="p-6 rounded-xl bg-ritual-card border border-ritual-border text-center text-gray-400">
        You don&apos;t own any names yet. Register one above!
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-ritual-card border border-ritual-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white glow-text">{myName}.ritual</p>
          {record && (
            <div className="mt-2 text-sm text-gray-400 space-y-1">
              <p>
                Resolves to:{" "}
                <span className="text-white font-mono text-xs">{record[1]}</span>
              </p>
              <p>
                Registered:{" "}
                <span className="text-white">
                  {new Date(Number(record[2]) * 1000).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Update address */}
      <div className="border-t border-ritual-border pt-4">
        <button
          onClick={() => setShowUpdate(!showUpdate)}
          className="text-sm text-ritual-accent hover:underline"
        >
          {showUpdate ? "Cancel" : "Update resolved address"}
        </button>

        {showUpdate && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              placeholder="0x... new address"
              className="w-full px-3 py-2 rounded-lg bg-ritual-bg border border-ritual-border text-white text-sm font-mono focus:outline-none focus:border-ritual-accent"
            />
            <button
              onClick={() => {
                writeContract({
                  address: RNS_ADDRESS,
                  abi: RNS_ABI,
                  functionName: "updateAddress",
                  args: [myName, newAddr as `0x${string}`],
                });
              }}
              disabled={!isAddress(newAddr) || isPending || confirming}
              className="px-4 py-2 rounded-lg bg-ritual-accent text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {isPending ? "Confirm..." : confirming ? "Updating..." : isSuccess ? "✓ Updated!" : "Update"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
