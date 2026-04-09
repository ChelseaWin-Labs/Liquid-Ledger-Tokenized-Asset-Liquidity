import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'

const router = Router()

// All transaction routes require authentication
router.use(require('../middleware/auth').authenticate)

// Get user transactions
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit
  const type = req.query.type as string

  const where = {
    userId: req.user!.id,
    ...(type && { type: type.toUpperCase() })
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where })
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

// Get single transaction
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: req.user!.id,
    },
    include: {
      asset: true,
    }
  })

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  res.json({
    success: true,
    data: { transaction }
  })
}))

export default router
