"use client";

import { useState, useEffect } from "react";
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { RNS_ADDRESS, RNS_ABI } from "@/lib/contract";

export function NameSearch() {
  const [name, setName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const { address } = useAccount();

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(name.toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [name]);

  const { data: isAvailable, isLoading: checking } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "isAvailable",
    args: debouncedName ? [debouncedName] : undefined,
    query: { enabled: debouncedName.length >= 3 },
  });

  const { data: record } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "getRecord",
    args: debouncedName && !isAvailable ? [debouncedName] : undefined,
    query: { enabled: debouncedName.length >= 3 && isAvailable === false },
  });

  const { data: regFee } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "REGISTRATION_FEE",
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
          placeholder="Search for a name..."
          className="w-full px-5 py-4 rounded-xl bg-ritual-card border border-ritual-border text-lg text-white placeholder-gray-500 focus:outline-none focus:border-ritual-accent transition-colors pr-20"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ritual-accent font-semibold">
          .ritual
        </span>
      </div>

      {/* Status */}
      {debouncedName.length >= 3 && (
        <div className="p-4 rounded-xl bg-ritual-card border border-ritual-border">
          {checking ? (
            <p className="text-gray-400">Checking {debouncedName}.ritual...</p>
          ) : isAvailable ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-medium">✓ {debouncedName}.ritual is available!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Registration fee: {regFee ? (Number(regFee) / 1e18).toFixed(2) : "0.01"} RITUAL
                </p>
              </div>
              {address && (
                <RegisterButton name={debouncedName} fee={regFee ?? parseEther("0.01")} />
              )}
            </div>
          ) : (
            <div>
              <p className="text-red-400 font-medium">✗ {debouncedName}.ritual is taken</p>
              {record && (
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  <p>Owner: <span className="text-white font-mono">{record[0].slice(0, 8)}...{record[0].slice(-6)}</span></p>
                  <p>Resolves to: <span className="text-white font-mono">{record[1].slice(0, 8)}...{record[1].slice(-6)}</span></p>
                  <p>Registered: <span className="text-white">{new Date(Number(record[2]) * 1000).toLocaleDateString()}</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RegisterButton({ name, fee }: { name: string; fee: bigint }) {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleRegister = () => {
    writeContract({
      address: RNS_ADDRESS,
      abi: RNS_ABI,
      functionName: "register",
      args: [name, address!],
      value: fee,
    });
  };

  if (isSuccess) {
    return (
      <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium">
        ✓ Registered!
      </span>
    );
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isPending || confirming}
      className="px-4 py-2 rounded-lg bg-ritual-accent text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
    >
      {isPending ? "Confirm..." : confirming ? "Registering..." : "Register"}
    </button>
  );
}
