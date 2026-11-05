import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import crypto from 'crypto'
import Joi from 'joi'

const router = Router()

// All card routes require authentication
router.use(authenticate)

// Get user cards
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const cards = await prisma.card.findMany({
    where: { userId: req.user!.id },
    orderBy: {
      createdAt: 'desc',
    },
  })

  res.json({
    success: true,
    data: { cards },
  })
}))

// Create new debit card
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    last4: Joi.string().length(4).optional(),
    brand: Joi.string().valid('Visa', 'Mastercard').default('Visa'),
    expiryMonth: Joi.number().min(1).max(12).default(12),
    expiryYear: Joi.number().min(new Date().getFullYear()).default(new Date().getFullYear() + 4),
    dailyLimit: Joi.number().positive().default(5000),
    monthlyLimit: Joi.number().positive().default(25000),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  // Generate last 4 digits if not provided
  const last4 = value.last4 || Math.floor(1000 + Math.random() * 9000).toString()

  const card = await prisma.card.create({
    data: {
      userId: req.user!.id,
      last4,
      brand: value.brand,
      expiryMonth: value.expiryMonth,
      expiryYear: value.expiryYear,
      dailyLimit: value.dailyLimit,
      monthlyLimit: value.monthlyLimit,
      isActive: true,
    },
  })

  res.status(201).json({
    success: true,
    data: { card },
  })
}))

// Get card details and recent transactions
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const card = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!card) {
    throw new AppError('Card not found', 404)
  }

  const transactions = await prisma.cardTransaction.findMany({
    where: { cardId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  res.json({
    success: true,
    data: { card, transactions },
  })
}))

// Update card settings (limits, freeze/unfreeze)
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const schema = Joi.object({
    dailyLimit: Joi.number().positive().optional(),
    monthlyLimit: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const existingCard = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!existingCard) {
    throw new AppError('Card not found', 404)
  }

  const card = await prisma.card.update({
    where: { id },
    data: value,
  })

  res.json({
    success: true,
    data: { card },
  })
}))

// POS debit authorization webhook / spend simulator
// Automatically liquidates tokenized RWAs at spot market price
router.post('/:id/authorize', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const schema = Joi.object({
    amount: Joi.number().positive().required(), // in USD
    merchant: Joi.string().required(),
    preferredAssetId: Joi.string().optional(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const card = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!card) {
    throw new AppError('Card not found', 404)
  }

  if (!card.isActive) {
    throw new AppError('Card is locked or frozen', 400)
  }

  // Check daily limit against today's card transactions
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todaySpend = await prisma.cardTransaction.aggregate({
    where: {
      cardId: id,
      status: 'approved',
      createdAt: { gte: startOfDay },
    },
    _sum: { amount: true },
  })

  const currentDailySum = todaySpend._sum.amount || 0
  if (currentDailySum + value.amount > card.dailyLimit) {
    throw new AppError(`Card daily limit exceeded. Available today: $${(card.dailyLimit - currentDailySum).toFixed(2)}`, 400)
  }

  // Find asset to liquidate
  let userAsset = null
  if (value.preferredAssetId) {
    userAsset = await prisma.userAsset.findFirst({
      where: {
        userId: req.user!.id,
        assetId: value.preferredAssetId,
      },
      include: { asset: true },
    })
  }

  if (!userAsset) {
    // Pick highest balance asset
    userAsset = await prisma.userAsset.findFirst({
      where: { userId: req.user!.id },
      include: { asset: true },
      orderBy: { valueInUSD: 'desc' },
    })
  }

  if (!userAsset) {
    throw new AppError('No tokenized assets found in user portfolio to back spend', 400)
  }

  // Calculate liquidation units
  const unitsToLiquidate = value.amount / userAsset.asset.currentPrice

  if (userAsset.balance < unitsToLiquidate) {
    throw new AppError(
      `Insufficient asset balance in ${userAsset.asset.symbol} to cover $${value.amount} purchase. Available: ${userAsset.balance.toFixed(4)} units ($${userAsset.valueInUSD.toFixed(2)})`,
      400
    )
  }

  const txHash = crypto.randomBytes(32).toString('hex')

  // Execute liquidation and card transaction atomically
  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Record approved card transaction
    const cardTx = await tx.cardTransaction.create({
      data: {
        cardId: id,
        merchant: value.merchant,
        amount: value.amount,
        assetId: userAsset!.assetId,
        status: 'approved',
        processedAt: new Date(),
      },
    })

    // 2. Deduct liquidated RWA units
    const remainingBalance = userAsset!.balance - unitsToLiquidate
    const remainingValue = remainingBalance * userAsset!.asset.currentPrice

    if (remainingBalance > 0.0000001) {
      await tx.userAsset.update({
        where: { id: userAsset!.id },
        data: {
          balance: remainingBalance,
          valueInUSD: remainingValue,
        },
      })
    } else {
      await tx.userAsset.delete({
        where: { id: userAsset!.id },
      })
    }

    // 3. Record master transaction audit log
    const masterTx = await tx.transaction.create({
      data: {
        userId: req.user!.id,
        assetId: userAsset!.assetId,
        type: 'SPEND',
        amount: unitsToLiquidate,
        price: userAsset!.asset.currentPrice,
        totalValue: value.amount,
        fee: 0,
        status: 'COMPLETED',
        stellarTransactionHash: txHash,
        metadata: {
          merchant: value.merchant,
          cardLast4: card.last4,
          cardTransactionId: cardTx.id,
        },
      },
    })

    return {
      cardTransaction: cardTx,
      masterTransaction: masterTx,
      liquidatedAsset: userAsset!.asset.symbol,
      liquidatedUnits: unitsToLiquidate,
      remainingBalance,
    }
  })

  res.status(200).json({
    success: true,
    message: 'Card payment authorized and RWA liquidity settled',
    data: result,
  })
}))

// Delete card
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const existingCard = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
  })

  if (!existingCard) {
    throw new AppError('Card not found', 404)
  }

  await prisma.card.delete({
    where: { id },
  })

  res.json({
    success: true,
    message: 'Card deleted successfully',
  })
}))

export default router
