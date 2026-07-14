import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ritualChain } from './chain'

export const config = createConfig({
  chains: [ritualChain],
  connectors: [injected()],
  transports: {
    [ritualChain.id]: http(),
  },
})
