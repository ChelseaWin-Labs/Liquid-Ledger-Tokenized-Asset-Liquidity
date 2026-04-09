import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import Joi from 'joi'

const router = Router()

// All asset routes require authentication except for getting available assets
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit
  const type = req.query.type as string

  const where = type ? { type: type.toUpperCase() } : {}

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        userAssets: req.user ? {
          where: { userId: req.user.id }
        } : false,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    }),
    prisma.asset.count({ where })
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
      }
    }
  })
}))

// Get single asset
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      userAssets: req.user ? {
        where: { userId: req.user.id }
      } : false,
      priceHistory: {
        orderBy: { timestamp: 'desc' },
        take: 24, // Last 24 price points
      }
    }
  })

  if (!asset) {
    throw new Error('Asset not found')
  }

  res.json({
    success: true,
    data: { asset }
  })
}))

// Buy asset
router.post('/:id/buy', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
    usdAmount: Joi.number().positive().required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const { amount, usdAmount } = req.body

  // Get asset
  const asset = await prisma.asset.findUnique({
    where: { id }
  })

  if (!asset) {
    throw new Error('Asset not found')
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user!.id,
      assetId: id,
      type: 'BUY',
      amount,
      price: usdAmount / amount,
      totalValue: usdAmount,
      fee: usdAmount * 0.001, // 0.1% fee
      status: 'PENDING',
    },
    include: {
      asset: true,
    }
  })

  // Update or create user asset
  const existingUserAsset = await prisma.userAsset.findUnique({
    where: {
      userId_assetId: {
        userId: req.user!.id,
        assetId: id,
      }
    }
  })

  if (existingUserAsset) {
    // Update existing asset
    const newBalance = existingUserAsset.balance + amount
    const newValue = existingUserAsset.valueInUSD + usdAmount
    const newAveragePrice = newValue / newBalance

    await prisma.userAsset.update({
      where: { id: existingUserAsset.id },
      data: {
        balance: newBalance,
        valueInUSD: newValue,
        averageBuyPrice: newAveragePrice,
      }
    })
  } else {
    // Create new user asset
    await prisma.userAsset.create({
      data: {
        userId: req.user!.id,
        assetId: id,
        balance: amount,
        valueInUSD: usdAmount,
        averageBuyPrice: usdAmount / amount,
      }
    })
  }

  // Update transaction status to completed (in real app, this would be after Stellar transaction confirmation)
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'COMPLETED',
      stellarTransactionHash: 'stellar-tx-hash-placeholder', // Would be actual Stellar hash
    }
  })

  res.json({
    success: true,
    data: { transaction }
  })
}))

// Sell asset
router.post('/:id/sell', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const { amount } = req.body

  // Get user asset
  const userAsset = await prisma.userAsset.findUnique({
    where: {
      userId_assetId: {
        userId: req.user!.id,
        assetId: id,
      }
    },
    include: {
      asset: true,
    }
  })

  if (!userAsset) {
    throw new Error('User asset not found')
  }

  if (userAsset.balance < amount) {
    throw new Error('Insufficient balance')
  }

  const usdAmount = amount * userAsset.asset.currentPrice

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user!.id,
      assetId: id,
      type: 'SELL',
      amount,
      price: userAsset.asset.currentPrice,
      totalValue: usdAmount,
      fee: usdAmount * 0.001, // 0.1% fee
      status: 'PENDING',
    },
    include: {
      asset: true,
    }
  })

  // Update user asset
  const newBalance = userAsset.balance - amount
  const newValue = newBalance * userAsset.asset.currentPrice

  if (newBalance > 0) {
    await prisma.userAsset.update({
      where: { id: userAsset.id },
      data: {
        balance: newBalance,
        valueInUSD: newValue,
      }
    })
  } else {
    // Remove user asset if balance is zero
    await prisma.userAsset.delete({
      where: { id: userAsset.id }
    })
  }

  // Update transaction status to completed
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'COMPLETED',
      stellarTransactionHash: 'stellar-tx-hash-placeholder',
    }
  })

  res.json({
    success: true,
    data: { transaction }
  })
}))

export default router
