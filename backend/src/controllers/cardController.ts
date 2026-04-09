import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import Joi from 'joi'

const router = Router()

// All card routes require authentication
router.use(require('../middleware/auth').authenticate)

// Get user cards
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
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

// Create new card
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({
    last4: Joi.string().length(4).required(),
    brand: Joi.string().required(),
    expiryMonth: Joi.number().min(1).max(12).required(),
    expiryYear: Joi.number().min(new Date().getFullYear()).required(),
    dailyLimit: Joi.number().positive().optional(),
    monthlyLimit: Joi.number().positive().optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  const cardData = req.body

  const card = await prisma.card.create({
    data: {
      userId: req.user!.id,
      ...cardData,
    }
  })

  res.status(201).json({
    success: true,
    data: { card }
  })
}))

// Update card settings
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  
  const schema = Joi.object({
    dailyLimit: Joi.number().positive().optional(),
    monthlyLimit: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw new Error(error.details[0].message)
  }

  // Check if card belongs to user
  const existingCard = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    }
  })

  if (!existingCard) {
    throw new Error('Card not found')
  }

  const card = await prisma.card.update({
    where: { id },
    data: req.body,
  })

  res.json({
    success: true,
    data: { card }
  })
}))

// Delete card
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  // Check if card belongs to user
  const existingCard = await prisma.card.findFirst({
    where: {
      id,
      userId: req.user!.id,
    }
  })

  if (!existingCard) {
    throw new Error('Card not found')
  }

  await prisma.card.delete({
    where: { id }
  })

  res.json({
    success: true,
    message: 'Card deleted successfully'
  })
}))

export default router
