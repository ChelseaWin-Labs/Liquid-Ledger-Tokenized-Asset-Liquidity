export interface User {
  id: string
  email: string
  name: string
  stellarPublicKey: string
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  name: string
  symbol: string
  type: 'gold' | 'treasury' | 'fund'
  stellarAssetCode: string
  stellarIssuer: string
  currentPrice: number
  priceChange24h: number
  totalSupply: number
  decimals: number
}

export interface UserAsset {
  id: string
  userId: string
  assetId: string
  balance: number
  valueInUSD: number
  averageBuyPrice: number
  createdAt: string
  updatedAt: string
  asset: Asset
}

export interface Transaction {
  id: string
  userId: string
  type: 'buy' | 'sell' | 'transfer' | 'spend'
  assetId: string
  amount: number
  price: number
  totalValue: number
  fee: number
  status: 'pending' | 'completed' | 'failed'
  stellarTransactionHash?: string
  createdAt: string
  asset: Asset
}

export interface Card {
  id: string
  userId: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isActive: boolean
  dailyLimit: number
  monthlyLimit: number
  createdAt: string
}

export interface Wallet {
  publicKey: string
  balance: number
  assets: UserAsset[]
  transactions: Transaction[]
}

export interface PriceData {
  assetId: string
  price: number
  timestamp: string
  change24h: number
  volume24h: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
