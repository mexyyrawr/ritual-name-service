import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { ritualChain } from "./chain";

export const config = createConfig({
  chains: [ritualChain],
  connectors: [injected()],
  transports: {
    [ritualChain.id]: http(
      process.env.NEXT_PUBLIC_RITUAL_RPC_URL ??
        "https://rpc.ritualfoundation.org"
    ),
  },
});
