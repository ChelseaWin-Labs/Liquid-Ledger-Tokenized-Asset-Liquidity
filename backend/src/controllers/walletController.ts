import { Router, Response } from 'express'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import { stellarService } from '../services/stellarService'
import { prisma } from '../config/database'

const router = Router()

// All wallet routes require authentication
router.use(authenticate)

// Connect / verify wallet address
router.post('/connect', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicKey } = req.body

  if (!publicKey) {
    throw new AppError('Public key is required', 400)
  }

  // Update user's registered stellar public key if not yet set or updating
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { stellarPublicKey: publicKey },
    select: {
      id: true,
      email: true,
      name: true,
      stellarPublicKey: true,
    },
  })

  // Try to load account from Stellar network
  let account = null
  try {
    account = await stellarService.getAccount(publicKey)
  } catch (err: any) {
    // Unfunded account on Stellar testnet
    account = {
      publicKey,
      balance: 0,
      assets: [],
      sequence: '0',
      isFunded: false,
    }
  }

  res.json({
    success: true,
    data: {
      user: updatedUser,
      account,
    },
  })
}))

// Get wallet balance from Stellar Horizon
router.get('/balance', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const account = await stellarService.getAccount(req.user!.stellarPublicKey)
    res.json({
      success: true,
      data: {
        balance: account.balance,
        assets: account.assets,
        sequence: account.sequence,
        isFunded: true,
      },
    })
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        balance: 0,
        assets: [],
        sequence: '0',
        isFunded: false,
        message: 'Account not funded or not found on network yet',
      },
    })
  }
}))

// Fund account with testnet Friendbot
router.post('/faucet', asyncHandler(async (req: AuthRequest, res: Response) => {
  const funded = await stellarService.fundWithFriendbot(req.user!.stellarPublicKey)
  if (!funded) {
    throw new AppError('Friendbot funding request failed. Try again later or account is already funded.', 400)
  }

  res.json({
    success: true,
    message: `Account ${req.user!.stellarPublicKey} funded successfully with testnet XLM`,
  })
}))

// Get on-chain transaction history from Horizon
router.get('/transactions', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  try {
    const transactions = await stellarService.getTransactionHistory(
      req.user!.stellarPublicKey,
      limit
    )
    res.json({
      success: true,
      data: { transactions },
    })
  } catch (error: any) {
    res.json({
      success: true,
      data: { transactions: [] },
    })
  }
}))

// Check network & Soroban RPC health
router.get('/network-health', asyncHandler(async (req: AuthRequest, res: Response) => {
  const health = await stellarService.getSorobanNetworkHealth()
  res.json({
    success: true,
    data: health,
  })
}))

export default router
