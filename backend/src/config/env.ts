import dotenv from 'dotenv'
import path from 'path'

// Load .env from root or backend directory
dotenv.config()

export interface AppConfig {
  env: string
  port: number
  frontendUrls: string[]
  jwtSecret: string
  jwtExpiresIn: string
  databaseUrl: string
  stellarNetwork: 'testnet' | 'public' | 'futurenet'
  horizonUrl: string
  sorobanRpcUrl: string
  rateLimitWindowMs: number
  rateLimitMax: number
}

const parseAllowedOrigins = (): string[] => {
  const defaults = ['http://localhost:3000', 'http://localhost:5173']
  if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map((u) => u.trim())
    return Array.from(new Set([...defaults, ...urls]))
  }
  return defaults
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrls: parseAllowedOrigins(),
  jwtSecret: process.env.JWT_SECRET || 'dev_liquid_ledger_jwt_secret_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/liquid_ledger?schema=public',
  stellarNetwork: (process.env.STELLAR_NETWORK as any) || 'testnet',
  horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
}
