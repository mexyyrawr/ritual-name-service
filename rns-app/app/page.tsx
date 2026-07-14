'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { RNS_ADDRESS, RNS_ABI } from '@/lib/contract'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [tab, setTab] = useState<'register' | 'send'>('register')
  const [name, setName] = useState('')
  const [sendName, setSendName] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState<'ok' | 'err' | ''>('')
  const [registeredName, setRegisteredName] = useState('')
  const [registeredAddr, setRegisteredAddr] = useState('')
  const [resolvedAddr, setResolvedAddr] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  const isRitual = chainId === 1979

  // Read: isAvailable
  const { data: available, refetch: refetchAvail } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: 'isAvailable',
    args: name ? [name.toLowerCase()] : undefined,
    query: { enabled: !!name && isRitual },
  })

  // Read: resolve name for send tab
  const { data: resolved, refetch: refetchResolved } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: 'resolve',
    args: sendName ? [sendName.toLowerCase()] : undefined,
    query: { enabled: !!sendName && isRitual },
  })

  // Read: reverse name
  const { data: reverseName } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: 'reverseNames',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isRitual },
  })

  // Read: fee
  const { data: fee } = useReadContract({
    address: RNS_ADDRESS,
    abi: RNS_ABI,
    functionName: 'registrationFee',
    query: { enabled: isRitual },
  })

  // Write: register
  const { writeContractAsync, isPending: isRegistering } = useWriteContract()

  // Wait for tx
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Update resolved address when name changes
  useEffect(() => {
    if (resolved && resolved !== '0x0000000000000000000000000000000000000000') {
      setResolvedAddr(resolved)
    } else {
      setResolvedAddr('')
    }
  }, [resolved])

  // Show success after tx confirmed
  useEffect(() => {
    if (isTxSuccess && txHash) {
      setStatus(`✅ ${registeredName}.ritual registered!`)
      setStatusType('ok')
      setTxHash(undefined)
    }
  }, [isTxSuccess, txHash, registeredName])

  const handleConnect = () => {
    const mm = connectors.find(c => c.id === 'injected')
    if (mm) connect({ connector: mm })
  }

  const handleSwitch = () => {
    switchChain({ chainId: 1979 })
  }

  const handleCheck = async () => {
    if (!name) return
    await refetchAvail()
  }

  const handleRegister = async () => {
    if (!address || !name) return
    if (available === false) {
      setStatus('❌ Nama sudah diambil!')
      setStatusType('err')
      return
    }

    setStatus('⏳ Mengirim transaksi...')
    setStatusType('')

    try {
      const hash = await writeContractAsync({
        address: RNS_ADDRESS,
        abi: RNS_ABI,
        functionName: 'register',
        args: [name.toLowerCase(), address],
        value: fee || parseEther('0.001'),
      })
      setRegisteredName(name.toLowerCase())
      setRegisteredAddr(address)
      setTxHash(hash)
      setStatus('⏳ Menunggu konfirmasi...')
    } catch (err: any) {
      setStatus('❌ ' + (err.message?.slice(0, 100) || 'Transaksi gagal'))
      setStatusType('err')
    }
  }

  const handleSend = async () => {
    if (!address || !sendName || !sendAmount) return

    setResolveLoading(true)
    await refetchResolved()
    setResolveLoading(false)

    if (!resolved || resolved === '0x0000000000000000000000000000000000000000') {
      setStatus('❌ Nama tidak ditemukan!')
      setStatusType('err')
      return
    }

    setStatus('⏳ Mengirim ke ' + resolved + '...')
    setStatusType('')

    try {
      const hash = await writeContractAsync({
        address: RNS_ADDRESS,
        abi: RNS_ABI,
        functionName: 'register', // just to use writeContractAsync for sending ETH
        args: ['', address],
        value: parseEther(sendAmount),
      })
      // Actually we need a different approach for sending ETH by name
      // Let me use a simple transfer instead
    } catch (err: any) {
      setStatus('❌ ' + (err.message?.slice(0, 100) || 'Transaksi gagal'))
      setStatusType('err')
    }
  }

  const handleSendViaWindow = async () => {
    if (!address || !sendName || !sendAmount) return

    setResolveLoading(true)
    await refetchResolved()
    setResolveLoading(false)

    if (!resolved || resolved === '0x0000000000000000000000000000000000000000') {
      setStatus('❌ Nama tidak ditemukan!')
      setStatusType('err')
      return
    }

    setStatus('⏳ Mengirim ' + sendAmount + ' RITUAL ke ' + sendName + '.ritual...')
    setStatusType('')

    try {
      const txHash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: resolved,
          value: '0x' + parseEther(sendAmount).toString(16),
        }],
      })
      setStatus('✅ Terkirim! Tx: ' + txHash.slice(0, 10) + '...')
      setStatusType('ok')
    } catch (err: any) {
      setStatus('❌ ' + (err.message?.slice(0, 100) || 'Transaksi gagal'))
      setStatusType('err')
    }
  }

  const shareOnX = () => {
    const text = `I just registered ${registeredName}.ritual on @ritualnetwork!\n\nClaim your .ritual name at:\nhttps://ritual-name-service.vercel.app\n\n#RitualChain #RNS`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Not connected
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
          <h1 style={{ color: '#2dd47a', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Ritual Name Service</h1>
          <p style={{ color: '#7a9a8a', marginBottom: 32 }}>Register your .ritual name</p>
          <button
            onClick={handleConnect}
            style={{ background: '#2dd47a', color: '#0a1a14', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            Connect MetaMask
          </button>
        </div>
      </div>
    )
  }

  // Wrong chain
  if (!isRitual) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: '#f59e0b', fontSize: 24, marginBottom: 16 }}>Switch to Ritual Chain</h1>
          <p style={{ color: '#7a9a8a', marginBottom: 24 }}>Current chain: {chainId}</p>
          <button
            onClick={handleSwitch}
            style={{ background: '#2dd47a', color: '#0a1a14', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            Switch to Ritual (1979)
          </button>
          <br /><br />
          <button onClick={() => disconnect()} style={{ background: 'none', border: '1px solid #f87171', color: '#f87171', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  // Main UI
  return (
    <div style={{ minHeight: '100vh', background: '#0a1a14', padding: '20px 16px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔮</div>
          <h1 style={{ color: '#2dd47a', fontSize: 28, fontWeight: 800, margin: 0 }}>Ritual Name Service</h1>
          <p style={{ color: '#4a7a6a', fontSize: 13, margin: '4px 0 0' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
            {reverseName && reverseName !== '' ? ` (${reverseName}.ritual)` : ''}
          </p>
          <button onClick={() => disconnect()} style={{ background: 'none', border: '1px solid #333', color: '#666', padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', marginTop: 8 }}>
            Disconnect
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0d2018', borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => setTab('register')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: tab === 'register' ? '#2dd47a' : 'transparent',
              color: tab === 'register' ? '#0a1a14' : '#5a8a7a',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Register
          </button>
          <button
            onClick={() => setTab('send')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: tab === 'send' ? '#2dd47a' : 'transparent',
              color: tab === 'send' ? '#0a1a14' : '#5a8a7a',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Send by Name
          </button>
        </div>

        {/* Register Tab */}
        {tab === 'register' && (
          <div style={{ background: '#0d2018', borderRadius: 16, padding: 24, border: '1px solid #1a3a2a' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value.toLowerCase()); setStatus(''); }}
                  placeholder="yourname"
                  style={{
                    width: '100%', padding: '14px 80px 14px 16px', borderRadius: 12, border: '1px solid #1a3a2a',
                    background: '#0a1a14', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#2dd47a', fontWeight: 700 }}>.ritual</span>
              </div>
              <button
                onClick={handleCheck}
                style={{ background: '#1a3a2a', color: '#2dd47a', border: 'none', padding: '0 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Check
              </button>
            </div>

            {/* Availability result */}
            {name && available !== undefined && (
              <div style={{
                padding: '10px 16px', borderRadius: 10, marginBottom: 12,
                background: available ? '#0a2a1a' : '#2a0a0a',
                border: `1px solid ${available ? '#2dd47a33' : '#f8717133'}`,
                color: available ? '#2dd47a' : '#f8717a',
                fontSize: 14,
              }}>
                {available ? `✅ ${name}.ritual tersedia!` : `❌ ${name}.ritual sudah diambil`}
              </div>
            )}

            {/* Fee info */}
            {fee && (
              <p style={{ color: '#4a7a6a', fontSize: 13, marginBottom: 16 }}>
                Fee: {Number(fee) / 1e18} RITUAL
              </p>
            )}

            {/* Register button */}
            <button
              onClick={handleRegister}
              disabled={!name || available === false || isRegistering || isWaitingTx}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: (!name || available === false || isRegistering || isWaitingTx) ? '#1a3a2a' : '#2dd47a',
                color: (!name || available === false || isRegistering || isWaitingTx) ? '#4a7a6a' : '#0a1a14',
                fontWeight: 700, fontSize: 16, cursor: (!name || available === false || isRegistering || isWaitingTx) ? 'not-allowed' : 'pointer',
              }}
            >
              {isRegistering ? '⏳ Sending...' : isWaitingTx ? '⏳ Confirming...' : `Register ${name || '...'}.ritual`}
            </button>

            {/* Status */}
            {status && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 10,
                background: statusType === 'ok' ? '#0a2a1a' : statusType === 'err' ? '#2a0a0a' : '#0d2018',
                color: statusType === 'ok' ? '#2dd47a' : statusType === 'err' ? '#f8717a' : '#7a9a8a',
                fontSize: 14, wordBreak: 'break-all',
              }}>
                {status}
              </div>
            )}

            {/* Success card */}
            {registeredName && isTxSuccess && (
              <div style={{
                marginTop: 16, background: '#0a1a14', borderRadius: 16, padding: 24,
                border: '1px solid #2dd47a33', textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h2 style={{ color: '#2dd47a', fontSize: 24, margin: '0 0 8px' }}>{registeredName}.ritual</h2>
                <p style={{ color: '#4a7a6a', fontSize: 12, wordBreak: 'break-all', margin: '0 0 16px' }}>{registeredAddr}</p>
                <button
                  onClick={shareOnX}
                  style={{ background: '#2dd47a', color: '#0a1a14', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  Share on X
                </button>
              </div>
            )}
          </div>
        )}

        {/* Send Tab */}
        {tab === 'send' && (
          <div style={{ background: '#0d2018', borderRadius: 16, padding: 24, border: '1px solid #1a3a2a' }}>
            <div style={{ marginBottom: 12 }}>
              <input
                value={sendName}
                onChange={e => { setSendName(e.target.value.toLowerCase()); setResolvedAddr(''); setStatus(''); }}
                placeholder="recipient.ritual"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #1a3a2a',
                  background: '#0a1a14', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Show resolved address */}
            {sendName && resolvedAddr && (
              <div style={{
                padding: '10px 16px', borderRadius: 10, marginBottom: 12,
                background: '#0a2a1a', border: '1px solid #2dd47a33',
                color: '#2dd47a', fontSize: 13, wordBreak: 'break-all',
              }}>
                → {resolvedAddr}
              </div>
            )}
            {sendName && resolved === '0x0000000000000000000000000000000000000000' && (
              <div style={{
                padding: '10px 16px', borderRadius: 10, marginBottom: 12,
                background: '#2a0a0a', border: '1px solid #f8717133',
                color: '#f8717a', fontSize: 13,
              }}>
                ❌ Nama tidak ditemukan
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                value={sendAmount}
                onChange={e => setSendAmount(e.target.value)}
                placeholder="Jumlah RITUAL"
                type="number"
                step="0.001"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #1a3a2a',
                  background: '#0a1a14', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSendViaWindow}
              disabled={!sendName || !sendAmount || !resolvedAddr}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: (!sendName || !sendAmount || !resolvedAddr) ? '#1a3a2a' : '#2dd47a',
                color: (!sendName || !sendAmount || !resolvedAddr) ? '#4a7a6a' : '#0a1a14',
                fontWeight: 700, fontSize: 16, cursor: (!sendName || !sendAmount || !resolvedAddr) ? 'not-allowed' : 'pointer',
              }}
            >
              Send RITUAL
            </button>

            {status && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 10,
                background: statusType === 'ok' ? '#0a2a1a' : statusType === 'err' ? '#2a0a0a' : '#0d2018',
                color: statusType === 'ok' ? '#2dd47a' : statusType === 'err' ? '#f8717a' : '#7a9a8a',
                fontSize: 14, wordBreak: 'break-all',
              }}>
                {status}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a
            href="https://explorer.ritualfoundation.org/address/0x0748176b3F44453c6E871012D41e10272abD60bC"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3a5a4a', fontSize: 12, textDecoration: 'none' }}
          >
            Contract
          </a>
          <span style={{ color: '#2a3a3a', margin: '0 8px' }}>•</span>
          <a
            href="https://github.com/mexyyrawr/ritual-name-service"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3a5a4a', fontSize: 12, textDecoration: 'none' }}
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
