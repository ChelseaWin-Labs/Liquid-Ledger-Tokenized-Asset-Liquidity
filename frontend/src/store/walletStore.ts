import { create } from 'zustand'
import { stellarClient, StellarAccountBalance } from '@/services/stellar'

interface WalletState {
  publicKey: string | null
  isConnected: boolean
  isConnecting: boolean
  network: 'TESTNET' | 'PUBLIC'
  balance: number
  assets: StellarAccountBalance[]
  error: string | null

  // Actions
  connect: () => Promise<void>
  connectWithKey: (pubKey: string) => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
}

const LOCAL_STORAGE_KEY = 'liquid_ledger_wallet'

const getStoredKey = (): string | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return localStorage.getItem(LOCAL_STORAGE_KEY)
  }
  return null
}

const setStoredKey = (key: string): void => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, key)
  }
}

const removeStoredKey = (): void => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: getStoredKey(),
  isConnected: !!getStoredKey(),
  isConnecting: false,
  network: 'TESTNET',
  balance: 0,
  assets: [],
  error: null,

  connect: async () => {
    set({ isConnecting: true, error: null })
    try {
      const isAvailable = await stellarClient.isWalletAvailable()
      let address: string

      if (isAvailable) {
        address = await stellarClient.connectWallet()
      } else {
        address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      }

      setStoredKey(address)
      const account = await stellarClient.getAccount(address)

      set({
        publicKey: address,
        isConnected: true,
        isConnecting: false,
        balance: account.balance,
        assets: account.assets,
        error: null,
      })
    } catch (err: any) {
      set({
        isConnecting: false,
        error: err?.message || 'Failed to connect wallet',
      })
    }
  },

  connectWithKey: async (pubKey: string) => {
    set({ isConnecting: true, error: null })
    try {
      setStoredKey(pubKey)
      const account = await stellarClient.getAccount(pubKey)

      set({
        publicKey: pubKey,
        isConnected: true,
        isConnecting: false,
        balance: account.balance,
        assets: account.assets,
        error: null,
      })
    } catch (err: any) {
      set({
        isConnecting: false,
        error: err?.message || 'Failed to connect account',
      })
    }
  },

  disconnect: () => {
    removeStoredKey()
    set({
      publicKey: null,
      isConnected: false,
      balance: 0,
      assets: [],
      error: null,
    })
  },

  refreshBalance: async () => {
    const { publicKey } = get()
    if (!publicKey) return

    try {
      const account = await stellarClient.getAccount(publicKey)
      set({
        balance: account.balance,
        assets: account.assets,
      })
    } catch {
      // Ignore background refresh errors
    }
  },
}))
