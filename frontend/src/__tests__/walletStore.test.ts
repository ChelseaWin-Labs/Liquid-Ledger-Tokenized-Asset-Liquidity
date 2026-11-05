import { describe, it, expect, beforeEach } from 'vitest'
import { useWalletStore } from '../store/walletStore'

describe('Zustand WalletStore State Management', () => {
  beforeEach(() => {
    useWalletStore.getState().disconnect()
  })

  it('should initialize with disconnected state', () => {
    const state = useWalletStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.publicKey).toBeNull()
    expect(state.balance).toBe(0)
    expect(state.network).toBe('TESTNET')
  })

  it('should connect with provided public key and set state', async () => {
    const demoKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    await useWalletStore.getState().connectWithKey(demoKey)

    const state = useWalletStore.getState()
    expect(state.isConnected).toBe(true)
    expect(state.publicKey).toBe(demoKey)
  })

  it('should disconnect cleanly and reset stored public key', async () => {
    const demoKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    await useWalletStore.getState().connectWithKey(demoKey)
    expect(useWalletStore.getState().isConnected).toBe(true)

    useWalletStore.getState().disconnect()
    const disconnectedState = useWalletStore.getState()
    expect(disconnectedState.isConnected).toBe(false)
    expect(disconnectedState.publicKey).toBeNull()
  })
})
