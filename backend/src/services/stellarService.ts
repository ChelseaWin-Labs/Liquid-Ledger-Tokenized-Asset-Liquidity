import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
  Memo,
  rpc as SorobanRpc,
} from 'stellar-sdk'
import axios from 'axios'
import { logger } from '../utils/logger'
import { config } from '../config/env'

export interface StellarAccountBalance {
  asset_code: string
  asset_issuer: string
  balance: string
  limit?: string
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
  ledger?: number
  xdr?: string
  error?: string
}

export class StellarService {
  private server: Horizon.Server
  private networkPassphrase: string
  private rpcServer: SorobanRpc.Server

  constructor() {
    this.server = new Horizon.Server(config.horizonUrl)
    this.networkPassphrase =
      config.stellarNetwork === 'public'
        ? Networks.PUBLIC
        : config.stellarNetwork === 'futurenet'
        ? Networks.FUTURENET
        : Networks.TESTNET
    this.rpcServer = new SorobanRpc.Server(config.sorobanRpcUrl)
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase
  }

  async getAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balances: StellarAccountBalance[] = account.balances.map((balance: any) => ({
        asset_code: 'asset_code' in balance ? balance.asset_code : 'XLM',
        asset_issuer: 'asset_issuer' in balance ? balance.asset_issuer : '',
        balance: balance.balance,
        limit: 'limit' in balance ? balance.limit : undefined,
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
      logger.error(`Failed to load Stellar account ${publicKey}:`, error?.message || error)
      throw new Error(`Failed to load Stellar account: ${error?.message || error}`)
    }
  }

  async checkTrustline(
    publicKey: string,
    assetCode: string,
    assetIssuer: string
  ): Promise<boolean> {
    if (assetCode === 'XLM') return true
    try {
      const account = await this.getAccount(publicKey)
      return account.assets.some(
        (a) => a.asset_code === assetCode && a.asset_issuer === assetIssuer
      )
    } catch {
      return false
    }
  }

  async buildTrustlineTransaction(
    sourcePublicKey: string,
    assetCode: string,
    assetIssuer: string,
    limit?: string
  ): Promise<string> {
    const sourceAccount = await this.server.loadAccount(sourcePublicKey)
    const asset = new Asset(assetCode, assetIssuer)

    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset,
          limit,
        })
      )
      .setTimeout(180)
      .build()

    return tx.toXDR()
  }

  async buildPaymentTransaction(
    sourcePublicKey: string,
    destinationPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    const sourceAccount = await this.server.loadAccount(sourcePublicKey)
    const asset =
      assetCode === 'XLM' || !assetIssuer
        ? Asset.native()
        : new Asset(assetCode, assetIssuer)

    let builder = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    }).addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset,
        amount,
      })
    )

    if (memo) {
      builder = builder.addMemo(Memo.text(memo.slice(0, 28)))
    }

    const tx = builder.setTimeout(180).build()
    return tx.toXDR()
  }

  async submitTransaction(signedXDR: string): Promise<TransactionResult> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        signedXDR,
        this.networkPassphrase
      )
      const response = await this.server.submitTransaction(transaction)

      return {
        success: true,
        hash: response.hash,
        ledger: response.ledger,
      }
    } catch (error: any) {
      const responseData = error?.response?.data
      const errorMsg =
        responseData?.extras?.result_codes?.transaction ||
        responseData?.detail ||
        error?.message ||
        'Transaction submission failed'

      logger.error('Failed to submit Stellar transaction:', {
        error: errorMsg,
        details: responseData?.extras?.result_codes,
      })

      return {
        success: false,
        error: errorMsg,
      }
    }
  }

  async sendIssuerPayment(
    issuerSecretKey: string,
    destinationPublicKey: string,
    assetCode: string,
    amount: string
  ): Promise<TransactionResult> {
    try {
      const issuerKeypair = Keypair.fromSecret(issuerSecretKey)
      const issuerAccount = await this.server.loadAccount(
        issuerKeypair.publicKey()
      )

      const asset =
        assetCode === 'XLM'
          ? Asset.native()
          : new Asset(assetCode, issuerKeypair.publicKey())

      const tx = new TransactionBuilder(issuerAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: destinationPublicKey,
            asset,
            amount,
          })
        )
        .setTimeout(180)
        .build()

      tx.sign(issuerKeypair)
      const response = await this.server.submitTransaction(tx)

      return {
        success: true,
        hash: response.hash,
        ledger: response.ledger,
      }
    } catch (error: any) {
      logger.error('Issuer payment execution failed:', error?.message || error)
      return {
        success: false,
        error: error?.message || 'Payment execution failed',
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
        operation_count: record.operation_count,
        memo: record.memo,
        fee_charged: record.fee_charged,
      }))
    } catch (error: any) {
      logger.error('Failed to get Stellar transaction history:', error?.message || error)
      throw new Error(`Failed to get transaction history: ${error?.message || error}`)
    }
  }

  async fundWithFriendbot(publicKey: string): Promise<boolean> {
    if (config.stellarNetwork !== 'testnet') {
      return false
    }
    try {
      const resp = await axios.get(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      )
      return resp.status === 200
    } catch (error: any) {
      logger.warn(`Friendbot funding notice for ${publicKey}: ${error?.message}`)
      return false
    }
  }

  async getSorobanNetworkHealth(): Promise<{ status: string; latestLedger?: number }> {
    try {
      const health = await this.rpcServer.getHealth()
      const latestLedger = await this.rpcServer.getLatestLedger()
      return {
        status: health.status,
        latestLedger: latestLedger.sequence,
      }
    } catch (error: any) {
      return {
        status: 'unreachable',
      }
    }
  }
}

export const stellarService = new StellarService()
