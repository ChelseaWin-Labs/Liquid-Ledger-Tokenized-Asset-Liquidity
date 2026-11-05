import { PrismaClient, AssetType, TransactionType, TransactionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Liquid Ledger database...')

  // 1. Clean existing records if any
  await prisma.cardTransaction.deleteMany()
  await prisma.card.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.userAsset.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.session.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create Default RWA Assets
  const issuerAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

  const gold = await prisma.asset.create({
    data: {
      name: 'Liquid Ledger Gold Token',
      symbol: 'GLD',
      type: AssetType.GOLD,
      stellarAssetCode: 'GLD',
      stellarIssuer: issuerAddress,
      currentPrice: 65.40,
      priceChange24h: 1.25,
      totalSupply: 10000000,
      decimals: 7,
      isActive: true,
    },
  })

  const treasury = await prisma.asset.create({
    data: {
      name: 'Liquid Ledger US Treasury 3M',
      symbol: 'UST',
      type: AssetType.TREASURY,
      stellarAssetCode: 'UST',
      stellarIssuer: issuerAddress,
      currentPrice: 100.15,
      priceChange24h: 0.05,
      totalSupply: 50000000,
      decimals: 7,
      isActive: true,
    },
  })

  const fund = await prisma.asset.create({
    data: {
      name: 'Liquid Ledger Diversified Fund',
      symbol: 'DIV',
      type: AssetType.FUND,
      stellarAssetCode: 'DIV',
      stellarIssuer: issuerAddress,
      currentPrice: 245.80,
      priceChange24h: -0.42,
      totalSupply: 25000000,
      decimals: 7,
      isActive: true,
    },
  })

  console.log('Assets created:', { gold: gold.symbol, treasury: treasury.symbol, fund: fund.symbol })

  // 3. Create Price History for charts
  const now = Date.now()
  const historyPoints = [
    { price: 63.5, change: 0.4, volume: 154000, offsetHours: 24 },
    { price: 64.1, change: 0.9, volume: 210000, offsetHours: 18 },
    { price: 64.8, change: 1.1, volume: 180000, offsetHours: 12 },
    { price: 65.2, change: 0.6, volume: 220000, offsetHours: 6 },
    { price: 65.4, change: 1.25, volume: 310000, offsetHours: 0 },
  ]

  for (const p of historyPoints) {
    await prisma.priceHistory.create({
      data: {
        assetId: gold.id,
        price: p.price,
        change24h: p.change,
        volume24h: p.volume,
        timestamp: new Date(now - p.offsetHours * 3600 * 1000),
      },
    })
  }

  // 4. Create Demo User
  const passwordHash = await bcrypt.hash('Password123!', 10)
  const user = await prisma.user.create({
    data: {
      email: 'demo@liquidledger.finance',
      name: 'Alex Vance',
      passwordHash,
      stellarPublicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('Demo user created:', user.email)

  // 5. Create User Asset Balances
  await prisma.userAsset.createMany({
    data: [
      {
        userId: user.id,
        assetId: gold.id,
        balance: 25.5,
        valueInUSD: 25.5 * gold.currentPrice,
        averageBuyPrice: 62.0,
      },
      {
        userId: user.id,
        assetId: treasury.id,
        balance: 1500.0,
        valueInUSD: 1500.0 * treasury.currentPrice,
        averageBuyPrice: 100.0,
      },
      {
        userId: user.id,
        assetId: fund.id,
        balance: 10.0,
        valueInUSD: 10.0 * fund.currentPrice,
        averageBuyPrice: 240.0,
      },
    ],
  })

  // 6. Create Demo Debit Card
  const card = await prisma.card.create({
    data: {
      userId: user.id,
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2028,
      dailyLimit: 5000,
      monthlyLimit: 25000,
      isActive: true,
    },
  })

  // 7. Create Sample Transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      assetId: gold.id,
      type: TransactionType.BUY,
      amount: 10.0,
      price: 64.0,
      totalValue: 640.0,
      fee: 0.64,
      status: TransactionStatus.COMPLETED,
      stellarTransactionHash: '4a8f9c1b7e3d2a0f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5',
      metadata: { memo: 'Initial gold acquisition' },
    },
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      assetId: treasury.id,
      type: TransactionType.BUY,
      amount: 1500.0,
      price: 100.0,
      totalValue: 150000.0,
      fee: 15.0,
      status: TransactionStatus.COMPLETED,
      stellarTransactionHash: '7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6',
      metadata: { memo: 'Treasury reserve buy' },
    },
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

