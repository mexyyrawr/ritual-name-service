"use client";

import { useState, useEffect } from "react";
import { useReadContract, useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import { RNS_ADDRESS, RNS_ABI } from "@/lib/contract";

export function SendByName() {
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [step, setStep] = useState<"search" | "confirm" | "done">("search");
  const { address } = useAccount();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(recipientName.toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [recipientName]);

  const { data: resolvedAddress, isLoading: resolving } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: "resolve",
    args: debouncedName.length >= 3 ? [debouncedName] : undefined,
    query: { enabled: debouncedName.length >= 3 },
  });

  const { data: hash, sendTransaction, isPending } = useSendTransaction();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSend = async () => {
    if (!resolvedAddress || !amount) return;
    sendTransaction({
      to: resolvedAddress,
      value: parseEther(amount),
    });
    setStep("done");
  };

  if (isSuccess && step === "done") {
    return (
      <div className="p-6 rounded-xl bg-ritual-card border border-green-500/30 text-center">
        <p className="text-green-400 text-lg font-medium mb-2">✓ Sent Successfully!</p>
        <p className="text-gray-400 text-sm">
          {amount} RITUAL → {debouncedName}.ritual
        </p>
        <a
          href={`https://explorer.ritualfoundation.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ritual-accent text-sm hover:underline mt-2 inline-block"
        >
          View on Explorer →
        </a>
        <button
          onClick={() => {
            setRecipientName("");
            setAmount("");
            setStep("search");
          }}
          className="block mx-auto mt-4 text-sm text-gray-400 hover:text-white"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recipient name */}
      <div className="relative">
        <input
          type="text"
          value={recipientName}
          onChange={(e) => {
            setRecipientName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""));
            setStep("search");
          }}
          placeholder="Recipient name..."
          className="w-full px-4 py-3 rounded-lg bg-ritual-card border border-ritual-border text-white placeholder-gray-500 focus:outline-none focus:border-ritual-accent transition-colors pr-16"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ritual-accent text-sm font-semibold">
          .ritual
        </span>
      </div>

      {/* Resolved address */}
      {debouncedName.length >= 3 && (
        <div className="text-sm">
          {resolving ? (
            <p className="text-gray-400">Resolving...</p>
          ) : resolvedAddress && resolvedAddress !== "0x0000000000000000000000000000000000000000" ? (
            <p className="text-green-400">
              ✓ {debouncedName}.ritual → <span className="font-mono text-xs">{resolvedAddress}</span>
            </p>
          ) : (
            <p className="text-red-400">✗ Name not found</p>
          )}
        </div>
      )}

      {/* Amount */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (RITUAL)"
        step="0.001"
        min="0"
        className="w-full px-4 py-3 rounded-lg bg-ritual-card border border-ritual-border text-white placeholder-gray-500 focus:outline-none focus:border-ritual-accent transition-colors"
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={
          !resolvedAddress ||
          resolvedAddress === "0x0000000000000000000000000000000000000000" ||
          !amount ||
          Number(amount) <= 0 ||
          isPending ||
          confirming ||
          !address
        }
        className="w-full py-3 rounded-lg bg-ritual-accent text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!address
          ? "Connect Wallet"
          : isPending
          ? "Confirm in wallet..."
          : confirming
          ? "Sending..."
          : `Send ${amount || "0"} RITUAL`}
      </button>
    </div>
  );
}
