import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import crypto from 'crypto'
import Joi from 'joi'

const router = Router()

// Get available assets (Public / optionally authenticated)
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit
  const type = req.query.type as string

  const where: any = { isActive: true }
  if (type) {
    where.type = type.toUpperCase()
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: {
        currentPrice: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.asset.count({ where }),
  ])

  res.json({
    success: true,
    data: {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}))

// Get single asset by ID with price history
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      priceHistory: {
        orderBy: { timestamp: 'desc' },
        take: 24,
      },
    },
  })

  if (!asset) {
    throw new AppError('Asset not found', 404)
  }

  res.json({
    success: true,
    data: { asset },
  })
}))

// Buy asset (Authenticated)
router.post('/:id/buy', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const schema = Joi.object({
    amount: Joi.number().positive().required(),
    usdAmount: Joi.number().positive().required(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const { amount, usdAmount } = value

  const asset = await prisma.asset.findUnique({
    where: { id },
  })

  if (!asset || !asset.isActive) {
    throw new AppError('Asset not available for trading', 404)
  }

  const txHash = crypto.randomBytes(32).toString('hex')
  const fee = usdAmount * 0.001 // 0.1% protocol fee

  // Execute atomically via Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: req.user!.id,
        assetId: id,
        type: 'BUY',
        amount,
        price: usdAmount / amount,
        totalValue: usdAmount,
        fee,
        status: 'COMPLETED',
        stellarTransactionHash: txHash,
        metadata: {
          assetSymbol: asset.symbol,
          executedAt: new Date().toISOString(),
        },
      },
      include: {
        asset: true,
      },
    })

    const existingUserAsset = await tx.userAsset.findUnique({
      where: {
        userId_assetId: {
          userId: req.user!.id,
          assetId: id,
        },
      },
    })

    let userAsset
    if (existingUserAsset) {
      const newBalance = existingUserAsset.balance + amount
      const newValue = existingUserAsset.valueInUSD + usdAmount
      const newAveragePrice = newValue / newBalance

      userAsset = await tx.userAsset.update({
        where: { id: existingUserAsset.id },
        data: {
          balance: newBalance,
          valueInUSD: newValue,
          averageBuyPrice: newAveragePrice,
        },
      })
    } else {
      userAsset = await tx.userAsset.create({
        data: {
          userId: req.user!.id,
          assetId: id,
          balance: amount,
          valueInUSD: usdAmount,
          averageBuyPrice: usdAmount / amount,
        },
      })
    }

    return { transaction, userAsset }
  })

  res.status(201).json({
    success: true,
    data: result,
  })
}))

// Sell asset (Authenticated)
router.post('/:id/sell', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const schema = Joi.object({
    amount: Joi.number().positive().required(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const { amount } = value

  const userAsset = await prisma.userAsset.findUnique({
    where: {
      userId_assetId: {
        userId: req.user!.id,
        assetId: id,
      },
    },
    include: {
      asset: true,
    },
  })

  if (!userAsset) {
    throw new AppError('User does not hold this asset', 404)
  }

  if (userAsset.balance < amount) {
    throw new AppError(
      `Insufficient asset balance. Available: ${userAsset.balance}, Requested: ${amount}`,
      400
    )
  }

  const usdAmount = amount * userAsset.asset.currentPrice
  const fee = usdAmount * 0.001
  const txHash = crypto.randomBytes(32).toString('hex')

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: req.user!.id,
        assetId: id,
        type: 'SELL',
        amount,
        price: userAsset.asset.currentPrice,
        totalValue: usdAmount,
        fee,
        status: 'COMPLETED',
        stellarTransactionHash: txHash,
        metadata: {
          assetSymbol: userAsset.asset.symbol,
          executedAt: new Date().toISOString(),
        },
      },
      include: {
        asset: true,
      },
    })

    const newBalance = userAsset.balance - amount
    const newValue = newBalance * userAsset.asset.currentPrice

    let updatedHolding = null
    if (newBalance > 0.0000001) {
      updatedHolding = await tx.userAsset.update({
        where: { id: userAsset.id },
        data: {
          balance: newBalance,
          valueInUSD: newValue,
        },
      })
    } else {
      await tx.userAsset.delete({
        where: { id: userAsset.id },
      })
    }

    return { transaction, userAsset: updatedHolding }
  })

  res.json({
    success: true,
    data: result,
  })
}))

export default router
