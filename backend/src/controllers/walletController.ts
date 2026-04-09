import { Router, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { stellarService } from '../services/stellarService'

const router = Router()

// All wallet routes require authentication
router.use(require('../middleware/auth').authenticate)

// Connect wallet
router.post('/connect', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { publicKey } = req.body

  if (!publicKey) {
    throw new Error('Public key is required')
  }

  // In a real app, you would verify the public key matches the user's stored key
  if (publicKey !== req.user!.stellarPublicKey) {
    throw new Error('Public key does not match user account')
  }

  // Get account details from Stellar
  const account = await stellarService.getAccount(publicKey)

  res.json({
    success: true,
    data: { account }
  })
}))

// Get wallet balance
router.get('/balance', asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await stellarService.getAccount(req.user!.stellarPublicKey)

  res.json({
    success: true,
    data: { 
      balance: account.balance,
      assets: account.assets 
    }
  })
}))

// Get transaction history
router.get('/transactions', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const transactions = await stellarService.getTransactionHistory(req.user!.stellarPublicKey, limit)

  res.json({
    success: true,
    data: { transactions }
  })
}))

export default router
