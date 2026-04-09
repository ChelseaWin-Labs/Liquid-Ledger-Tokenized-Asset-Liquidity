import { Server, Networks, TransactionBuilder, Operation, Asset } from 'stellar-sdk'
import { logger } from '../utils/logger'

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

  async getAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balances = account.balances.map((balance: any) => ({
        asset_code: 'asset_code' in balance ? balance.asset_code : 'XLM',
        asset_issuer: 'asset_issuer' in balance ? balance.asset_issuer : '',
        balance: balance.balance,
      }))

      return {
        publicKey: account.accountId(),
        balance: parseFloat(balances.find((b: any) => b.asset_code === 'XLM')?.balance || '0'),
        assets: balances,
      }
    } catch (error) {
      logger.error('Failed to load Stellar account:', error)
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

      logger.info('Stellar transaction created:', transaction)
      
      return {
        success: true,
        hash: 'simulated-transaction-hash',
      }
    } catch (error) {
      logger.error('Stellar transaction failed:', error)
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

      logger.info('Stellar payment transaction created:', transaction)
      
      return {
        success: true,
        hash: 'simulated-payment-hash',
      }
    } catch (error) {
      logger.error('Stellar payment failed:', error)
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

      return transactions.records.map((record: any) => ({
        hash: record.hash,
        created_at: record.created_at,
        successful: record.successful,
        source_account: record.source_account,
        operations: record.operations,
      }))
    } catch (error) {
      logger.error('Failed to get Stellar transaction history:', error)
      throw new Error(`Failed to get transaction history: ${error}`)
    }
  }

  async submitTransaction(transactionXDR: string): Promise<TransactionResult> {
    try {
      const result = await this.server.submitTransaction(transactionXDR)
      
      return {
        success: true,
        hash: result.hash,
      }
    } catch (error: any) {
      logger.error('Failed to submit Stellar transaction:', error)
      
      return {
        success: false,
        error: error.message || 'Transaction submission failed',
      }
    }
  }
}

export const stellarService = new StellarService()
