import { Server, Networks, TransactionBuilder, Operation, Asset } from 'stellar-sdk'
import { allowAccess } from '@stellar/freighter-api'

const server = new Server('https://horizon-testnet.stellar.org')
const networkPassphrase = Networks.TESTNET

export interface StellarAccount {
  publicKey: string
  balance: number
  assets: Array<{
    asset_code: string
    asset_issuer: string
    balance: string
  }>
}

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
}

export class StellarService {
  private server: Server

  constructor() {
    this.server = server
  }

  async connectWallet(): Promise<string> {
    try {
      const response = await allowAccess()
      if (response.address) {
        return response.address
      }
      throw new Error('Failed to connect wallet')
    } catch (error) {
      throw new Error(`Wallet connection failed: ${error}`)
    }
  }

  async getAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balances = account.balances.map(balance => ({
        asset_code: 'asset_code' in balance ? balance.asset_code : 'XLM',
        asset_issuer: 'asset_issuer' in balance ? balance.asset_issuer : '',
        balance: balance.balance,
      }))

      return {
        publicKey: account.accountId(),
        balance: parseFloat(balances.find(b => b.asset_code === 'XLM')?.balance || '0'),
        assets: balances,
      }
    } catch (error) {
      throw new Error(`Failed to load account: ${error}`)
    }
  }

  async createTokenizedAsset(
    sourcePublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string
  ): Promise<TransactionResult> {
    try {
      const sourceAccount = await this.server.loadAccount(sourcePublicKey)
      
      const asset = new Asset(assetCode, assetIssuer)
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase,
      })
        .addOperation(Operation.payment({
          destination: sourcePublicKey,
          asset,
          amount,
        }))
        .setTimeout(30)
        .build()

      // In a real app, this would be signed using Freighter or another wallet
      // For now, we'll simulate the transaction
      console.log('Transaction created:', transaction)
      
      return {
        success: true,
        hash: 'simulated-transaction-hash',
      }
    } catch (error) {
      return {
        success: false,
        error: `Transaction failed: ${error}`,
      }
    }
  }

  async sendPayment(
    sourcePublicKey: string,
    destinationPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string
  ): Promise<TransactionResult> {
    try {
      const sourceAccount = await this.server.loadAccount(sourcePublicKey)
      const asset = assetCode === 'XLM' 
        ? Asset.native() 
        : new Asset(assetCode, assetIssuer)

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase,
      })
        .addOperation(Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount,
        }))
        .setTimeout(30)
        .build()

      console.log('Payment transaction created:', transaction)
      
      return {
        success: true,
        hash: 'simulated-payment-hash',
      }
    } catch (error) {
      return {
        success: false,
        error: `Payment failed: ${error}`,
      }
    }
  }

  async getTransactionHistory(publicKey: string, limit = 10) {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .call()

      return transactions.records.map(record => ({
        hash: record.hash,
        created_at: record.created_at,
        successful: record.successful,
        source_account: record.source_account,
        operations: record.operations,
      }))
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error}`)
    }
  }
}

export const stellarService = new StellarService()
