import {
  isConnected as isFreighterConnected,
  requestAccess,
  getPublicKey,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api'
import { Horizon, Networks, Asset } from 'stellar-sdk'

const HORIZON_URL =
  import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE =
  import.meta.env.VITE_STELLAR_NETWORK === 'public'
    ? Networks.PUBLIC
    : Networks.TESTNET

const server = new Horizon.Server(HORIZON_URL)

export interface StellarAccountBalance {
  asset_code: string
  asset_issuer: string
  balance: string
}

export interface StellarAccount {
  publicKey: string
  balance: number
  assets: StellarAccountBalance[]
  sequence: string
}

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
}

export class StellarClient {
  private server: Horizon.Server
  private networkPassphrase: string

  constructor() {
    this.server = server
    this.networkPassphrase = NETWORK_PASSPHRASE
  }

  async isWalletAvailable(): Promise<boolean> {
    try {
      return await isFreighterConnected()
    } catch {
      return false
    }
  }

  async connectWallet(): Promise<string> {
    try {
      const accessObj = await requestAccess()
      if (accessObj && typeof accessObj === 'object' && 'address' in accessObj) {
        return (accessObj as any).address
      }

      const key = await getPublicKey()
      if (key) {
        return key
      }
      throw new Error('No account found in Freighter wallet')
    } catch (error: any) {
      throw new Error(
        error?.message || 'Freighter wallet connection failed. Ensure extension is unlocked.'
      )
    }
  }

  async getAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balances: StellarAccountBalance[] = account.balances.map((b: any) => ({
        asset_code: 'asset_code' in b ? b.asset_code : 'XLM',
        asset_issuer: 'asset_issuer' in b ? b.asset_issuer : '',
        balance: b.balance,
      }))

      const xlmBalance = parseFloat(
        balances.find((b) => b.asset_code === 'XLM')?.balance || '0'
      )

      return {
        publicKey: account.accountId(),
        balance: xlmBalance,
        assets: balances,
        sequence: account.sequenceNumber(),
      }
    } catch (error: any) {
      return {
        publicKey,
        balance: 0,
        assets: [],
        sequence: '0',
      }
    }
  }

  async signWithFreighter(xdr: string): Promise<string> {
    try {
      return await signTransaction(xdr, {
        network: 'TESTNET',
        networkPassphrase: this.networkPassphrase,
      })
    } catch (error: any) {
      throw new Error(`Signing cancelled or failed: ${error?.message || error}`)
    }
  }
}

export const stellarClient = new StellarClient()
export default stellarClient
