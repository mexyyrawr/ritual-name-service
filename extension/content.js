// RNS Content Script — floating resolver overlay
(function () {
  "use strict";

  const RNS_CONTRACT = "0x9f138b859e517A8f441E6A62e72183192B32d10e";
  const RPC_URL = "https://rpc.ritualfoundation.org";
  const CHAIN_ID = 1979;

  // RNS ABI fragments we need
  const RESOLVE_SELECTOR = "0x59d1d43c"; // resolve(string)
  const IS_AVAILABLE_SELECTOR = "0x983b2d56"; // isAvailable(string)

  // Don't inject on MetaMask extension pages
  if (location.href.startsWith("chrome-extension://")) return;

  let overlay = null;
  let collapsed = true;

  function createOverlay() {
    if (document.getElementById("rns-overlay")) return;

    overlay = document.createElement("div");
    overlay.id = "rns-overlay";
    overlay.className = "collapsed";
    overlay.innerHTML = `
      <div class="rns-fab" title="RNS Resolver">🔮</div>
      <div class="rns-header">
        <h3>🔮 RNS Resolver</h3>
        <button class="rns-minimize" title="Minimize">−</button>
      </div>
      <div class="rns-body">
        <div class="rns-input-group">
          <input type="text" id="rns-name-input" placeholder="Enter name..." autocomplete="off" spellcheck="false" />
          <span class="rns-suffix">.ritual</span>
        </div>
        <div class="rns-amount-group" style="position:relative;">
          <input type="number" id="rns-amount-input" placeholder="Amount (RITUAL)" step="0.001" min="0" />
          <span class="rns-suffix" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#666;font-size:13px;">RITUAL</span>
        </div>
        <div class="rns-status" id="rns-status"></div>
        <div id="rns-resolved-addr" style="display:none;" class="rns-resolved"></div>
        <button class="rns-btn" id="rns-send-btn" disabled>Resolve a name first</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Events
    overlay.querySelector(".rns-fab").addEventListener("click", () => toggleOverlay(false));
    overlay.querySelector(".rns-minimize").addEventListener("click", () => toggleOverlay(true));

    const nameInput = overlay.querySelector("#rns-name-input");
    let debounce = null;
    nameInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => resolveName(nameInput.value), 400);
    });

    overlay.querySelector("#rns-send-btn").addEventListener("click", sendViaMetaMask);
  }

  function toggleOverlay(collapse) {
    collapsed = collapse;
    overlay.className = collapse ? "collapsed" : "";
  }

  async function resolveName(name) {
    const status = overlay.querySelector("#rns-status");
    const addrDiv = overlay.querySelector("#rns-resolved-addr");
    const btn = overlay.querySelector("#rns-send-btn");

    name = name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (name.length < 3) {
      status.className = "rns-status"; status.style.display = "none";
      addrDiv.style.display = "none";
      btn.disabled = true; btn.textContent = "Min 3 characters";
      return;
    }

    status.className = "rns-status loading";
    status.textContent = "Resolving " + name + ".ritual...";
    status.style.display = "block";
    addrDiv.style.display = "none";
    btn.disabled = true; btn.textContent = "Resolving...";

    try {
      // encode resolve(string) call
      const nameHex = Buffer.from(name).toString("hex");
      const nameLenHex = name.length.toString(16).padStart(64, "0");
      const nameHexPadded = nameHex.padEnd(Math.ceil(nameHex.length / 64) * 64, "0");
      const data = RESOLVE_SELECTOR + "0000000000000000000000000000000000000000000000000000000000000020" + nameLenHex + nameHexPadded;

      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to: RNS_CONTRACT, data }, "latest"],
        }),
      });

      const json = await res.json();

      if (json.error || json.result === "0x" + "0".repeat(64)) {
        status.className = "rns-status error";
        status.textContent = "✗ " + name + ".ritual not found";
        btn.disabled = true;
        btn.textContent = "Name not registered";
        return;
      }

      const addr = "0x" + json.result.slice(26);
      status.className = "rns-status success";
      status.textContent = "✓ " + name + ".ritual resolved!";
      addrDiv.textContent = addr;
      addrDiv.style.display = "block";
      addrDiv.dataset.address = addr;
      addrDiv.dataset.name = name;
      btn.disabled = false;
      btn.textContent = "Send RITUAL via MetaMask";
    } catch (e) {
      status.className = "rns-status error";
      status.textContent = "✗ RPC error: " + e.message;
      btn.disabled = true;
      btn.textContent = "Error";
    }
  }

  async function sendViaMetaMask() {
    const addr = overlay.querySelector("#rns-resolved-addr").dataset.address;
    const name = overlay.querySelector("#rns-resolved-addr").dataset.name;
    const amount = overlay.querySelector("#rns-amount-input").value;

    if (!addr) return;

    if (!window.ethereum) {
      alert("MetaMask not detected! Install MetaMask first.");
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      // Check chain
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (parseInt(chainId, 16) !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + CHAIN_ID.toString(16) }],
          });
        } catch {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x" + CHAIN_ID.toString(16),
              chainName: "Ritual",
              nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ["https://explorer.ritualfoundation.org"],
            }],
          });
        }
      }

      const valueHex = amount
        ? "0x" + (BigInt(Math.floor(parseFloat(amount) * 1e18))).toString(16)
        : "0x0";

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: accounts[0],
          to: addr,
          value: valueHex,
        }],
      });

      const btn = overlay.querySelector("#rns-send-btn");
      btn.textContent = "✓ Sent! " + txHash.slice(0, 10) + "...";
      btn.style.background = "#166534";

      setTimeout(() => {
        btn.textContent = "Send RITUAL via MetaMask";
        btn.style.background = "#7c3aed";
      }, 5000);
    } catch (e) {
      alert("Transaction failed: " + e.message);
    }
  }

  // Create overlay when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createOverlay);
  } else {
    createOverlay();
  }
})();
