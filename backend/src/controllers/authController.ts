import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import Joi from 'joi'

const router = Router()

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  stellarPublicKey: Joi.string().required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  return { accessToken, refreshToken }
}

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { error } = registerSchema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const { email, password, name, stellarPublicKey } = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { stellarPublicKey }]
    }
  })

  if (existingUser) {
    throw new AppError('User with this email or Stellar public key already exists', 400)
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      stellarPublicKey,
    },
    select: {
      id: true,
      email: true,
      name: true,
      stellarPublicKey: true,
      createdAt: true,
    }
  })

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id)

  // Save refresh token to database
  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }
  })

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    }
  })
}))

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { error } = loginSchema.validate(req.body)
  if (error) {
    throw new AppError(error.details[0].message, 400)
  }

  const { email, password } = req.body

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401)
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id)

  // Save refresh token to database
  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }
  })

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        stellarPublicKey: user.stellarPublicKey,
      },
      accessToken,
      refreshToken,
    }
  })
}))

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400)
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any

  // Find session
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  })

  if (!session || session.userId !== decoded.userId) {
    throw new AppError('Invalid refresh token', 401)
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId)

  // Update session
  await prisma.session.update({
    where: { id: session.id },
    data: {
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }
  })

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    }
  })
}))

// Logout user
router.post('/logout', asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (token) {
    // Remove session from database
    await prisma.session.deleteMany({
      where: { token }
    })
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}))

// Get current user
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
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
    }
  })

  res.json({
    success: true,
    data: { user }
  })
}))

export default router
