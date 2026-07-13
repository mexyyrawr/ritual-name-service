"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { NameSearch } from "@/components/NameSearch";
import { SendByName } from "@/components/SendByName";
import { MyNames } from "@/components/MyNames";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-ritual-border bg-ritual-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <h1 className="text-xl font-bold text-white">RNS</h1>
            <span className="text-xs text-gray-400 bg-ritual-card px-2 py-0.5 rounded-full border border-ritual-border">
              Ritual Name Service
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold text-white glow-text">
            Your Identity on Ritual
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Register a human-readable name. Send RITUAL tokens by name instead of
            copying long addresses.
          </p>
        </div>

        {/* Register Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ritual-accent text-white text-xs flex items-center justify-center">1</span>
            Register a Name
          </h3>
          <NameSearch />
        </section>

        {/* Send Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ritual-accent text-white text-xs flex items-center justify-center">2</span>
            Send by Name
          </h3>
          <div className="p-6 rounded-xl bg-ritual-card border border-ritual-border">
            <SendByName />
          </div>
        </section>

        {/* My Names */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-ritual-accent text-white text-xs flex items-center justify-center">3</span>
            My Name
          </h3>
          <MyNames />
        </section>

        {/* How it works */}
        <section className="p-6 rounded-xl bg-ritual-card/50 border border-ritual-border space-y-4">
          <h3 className="text-lg font-semibold text-white">How RNS Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-2xl">📝</div>
              <p className="font-medium text-white">Register</p>
              <p className="text-gray-400">
                Pay 0.01 RITUAL to register a unique name (3-32 chars).
                Names are case-insensitive.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🔗</div>
              <p className="font-medium text-white">Resolve</p>
              <p className="text-gray-400">
                Your name maps to any Ritual address. Update it anytime
                if you change wallets.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">💸</div>
              <p className="font-medium text-white">Send</p>
              <p className="text-gray-400">
                Send RITUAL by typing a name instead of pasting
                a 42-character address.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ritual-border py-6 text-center text-gray-500 text-sm">
        Built on{" "}
        <a
          href="https://ritual.foundation"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ritual-accent hover:underline"
        >
          Ritual Chain
        </a>{" "}
        (Chain ID 1979)
      </footer>
    </div>
  );
}
