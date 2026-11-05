import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import Joi from 'joi'

const router = Router()

// All user routes require authentication
router.use(require('../middleware/auth').authenticate)

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      stellarPublicKey: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  res.json({
    success: true,
    data: { user }
  })
}))

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    name: Joi.string().min(2).optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const { name } = req.body

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name },
    select: {
      id: true,
      email: true,
      name: true,
      stellarPublicKey: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  res.json({
    success: true,
    data: { user }
  })
}))

// Get user assets
router.get('/assets', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userAssets = await prisma.userAsset.findMany({
    where: { userId: req.user!.id },
    include: {
      asset: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  res.json({
    success: true,
    data: { userAssets }
  })
}))

// Get user transactions
router.get('/transactions', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.user!.id },
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    }),
    prisma.transaction.count({
      where: { userId: req.user!.id }
    })
  ])

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  })
}))

// Get user cards
router.get('/cards', asyncHandler(async (req: AuthRequest, res: Response) => {
  const cards = await prisma.card.findMany({
    where: { userId: req.user!.id },
    orderBy: {
      createdAt: 'desc'
    }
  })

  res.json({
    success: true,
    data: { cards }
  })
}))

// Get portfolio summary
router.get('/portfolio', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userAssets = await prisma.userAsset.findMany({
    where: { userId: req.user!.id },
    include: {
      asset: true,
    },
  })

  const totalValue = userAssets.reduce((sum: number, ua: any) => sum + ua.valueInUSD, 0)
  const totalAssets = userAssets.length

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: req.user!.id },
    include: {
      asset: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
  })

  res.json({
    success: true,
    data: {
      totalValue,
      totalAssets,
      assets: userAssets,
      recentTransactions,
    }
  })
}))

export default router
