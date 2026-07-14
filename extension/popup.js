const RNS_CONTRACT = "0x9f138b859e517A8f441E6A62e72183192B32d10e";
const RPC_URL = "https://rpc.ritualfoundation.org";
const CHAIN_ID = 1979;
const RESOLVE_SELECTOR = "0x461a4478";

const nameInput = document.getElementById("nameInput");
const amountInput = document.getElementById("amountInput");
const status = document.getElementById("status");
const resolvedAddr = document.getElementById("resolvedAddr");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyBtn");

let resolvedAddress = null;

nameInput.addEventListener("input", () => {
  clearTimeout(nameInput._debounce);
  nameInput._debounce = setTimeout(() => resolveName(nameInput.value), 400);
});

async function resolveName(name) {
  name = name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (name.length < 3) {
    hideStatus();
    sendBtn.disabled = true;
    sendBtn.textContent = "Min 3 characters";
    return;
  }

  status.className = "status loading";
  status.textContent = "Resolving " + name + ".ritual...";

  try {
    const nameHex = Buffer.from(name).toString("hex");
    const nameLenHex = name.length.toString(16).padStart(64, "0");
    const nameHexPadded = nameHex.padEnd(Math.ceil(nameHex.length / 64) * 64, "0");
    const data = RESOLVE_SELECTOR + "0000000000000000000000000000000000000000000000000000000000000020" + nameLenHex + nameHexPadded;

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: RNS_CONTRACT, data }, "latest"] }),
    });
    const json = await res.json();

    if (json.error || json.result === "0x" + "0".repeat(64)) {
      status.className = "status error";
      status.textContent = "✗ " + name + ".ritual not found";
      sendBtn.disabled = true;
      sendBtn.textContent = "Name not registered";
      copyBtn.style.display = "none";
      return;
    }

    resolvedAddress = "0x" + json.result.slice(26);
    status.className = "status success";
    status.textContent = "✓ " + name + ".ritual";
    resolvedAddr.textContent = resolvedAddress;
    resolvedAddr.style.display = "block";
    sendBtn.disabled = false;
    sendBtn.textContent = "Send RITUAL via MetaMask";
    copyBtn.style.display = "block";
  } catch (e) {
    status.className = "status error";
    status.textContent = "✗ Error: " + e.message;
    sendBtn.disabled = true;
    sendBtn.textContent = "Error";
  }
}

sendBtn.addEventListener("click", async () => {
  if (!resolvedAddress || !window.ethereum) {
    alert("MetaMask not detected!");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (parseInt(chainId, 16) !== CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + CHAIN_ID.toString(16) }],
      }).catch(() =>
        window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x" + CHAIN_ID.toString(16),
            chainName: "Ritual",
            nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: ["https://explorer.ritualfoundation.org"],
          }],
        })
      );
    }

    const amount = amountInput.value;
    const valueHex = amount
      ? "0x" + BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16)
      : "0x0";

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: accounts[0], to: resolvedAddress, value: valueHex }],
    });

    sendBtn.textContent = "✓ Sent! " + txHash.slice(0, 10) + "...";
    sendBtn.style.background = "#166534";
    setTimeout(() => {
      sendBtn.textContent = "Send RITUAL via MetaMask";
      sendBtn.style.background = "#7c3aed";
    }, 5000);
  } catch (e) {
    alert("Failed: " + e.message);
  }
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(resolvedAddress);
  copyBtn.textContent = "✓ Copied!";
  setTimeout(() => { copyBtn.textContent = "Copy Address"; }, 2000);
});

document.getElementById("openMint").addEventListener("click", (e) => {
  e.preventDefault();
  // Change this to your deployed mint page URL
  chrome.tabs.create({ url: "https://ritual-name-service.vercel.app" });
});

function hideStatus() {
  status.className = "status";
  status.style.display = "none";
  resolvedAddr.style.display = "none";
  copyBtn.style.display = "none";
  resolvedAddress = null;
}

// Polyfill Buffer for popup
if (typeof Buffer === "undefined") {
  window.Buffer = {
    from(str) {
      return {
        toString(enc) {
          if (enc === "hex") return Array.from(new TextEncoder().encode(str)).map(b => b.toString(16).padStart(2, "0")).join("");
          return str;
        }
      };
    }
  };
}
