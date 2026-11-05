import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import { stellarService } from '../services/stellarService'
import Joi from 'joi'

const router = Router()

// All transaction routes require authentication
router.use(authenticate)

// Get user transactions with pagination & filtering
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit
  const type = req.query.type as string

  const where: any = {
    userId: req.user!.id,
  }

  if (type) {
    where.type = type.toUpperCase()
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        asset: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
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
      },
    },
  })
}))

// Get aggregate transaction statistics
router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.user!.id,
      status: 'COMPLETED',
    },
  })

  const totalVolume = transactions.reduce((sum: number, tx: any) => sum + tx.totalValue, 0)
  const totalFees = transactions.reduce((sum: number, tx: any) => sum + tx.fee, 0)
  const count = transactions.length

  res.json({
    success: true,
    data: {
      totalVolume,
      totalFees,
      completedTransactionsCount: count,
    },
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
    },
  })

  if (!transaction) {
    throw new AppError('Transaction not found', 404)
  }

  res.json({
    success: true,
    data: { transaction },
  })
}))

// Build unsigned payment transaction for client-side Freighter signing
router.post('/build-payment', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    destinationPublicKey: Joi.string().required(),
    assetCode: Joi.string().default('XLM'),
    assetIssuer: Joi.string().allow('').optional(),
    amount: Joi.string().required(),
    memo: Joi.string().max(28).optional(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const xdr = await stellarService.buildPaymentTransaction(
    req.user!.stellarPublicKey,
    value.destinationPublicKey,
    value.assetCode,
    value.assetIssuer || '',
    value.amount,
    value.memo
  )

  res.json({
    success: true,
    data: { xdr },
  })
}))

// Build unsigned trustline transaction for client-side Freighter signing
router.post('/build-trustline', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    assetCode: Joi.string().required(),
    assetIssuer: Joi.string().required(),
    limit: Joi.string().optional(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const xdr = await stellarService.buildTrustlineTransaction(
    req.user!.stellarPublicKey,
    value.assetCode,
    value.assetIssuer,
    value.limit
  )

  res.json({
    success: true,
    data: { xdr },
  })
}))

// Submit signed transaction XDR directly to Stellar Horizon
router.post('/submit-xdr', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    signedXdr: Joi.string().required(),
    transactionId: Joi.string().optional(),
  })

  const { error, value } = schema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const result = await stellarService.submitTransaction(value.signedXdr)

  if (value.transactionId) {
    if (result.success && result.hash) {
      await prisma.transaction.update({
        where: { id: value.transactionId },
        data: {
          status: 'COMPLETED',
          stellarTransactionHash: result.hash,
        },
      })
    } else {
      await prisma.transaction.update({
        where: { id: value.transactionId },
        data: {
          status: 'FAILED',
          metadata: { failureReason: result.error },
        },
      })
    }
  }

  if (!result.success) {
    throw new AppError(result.error || 'Transaction submission failed', 400)
  }

  res.json({
    success: true,
    data: {
      hash: result.hash,
      ledger: result.ledger,
    },
  })
}))

export default router
