import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    stellarPublicKey: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        stellarPublicKey: true,
      },
    })

    if (!user) {
      throw new AppError('Invalid token. User not found.', 401)
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // For now, all authenticated users have the same role
    // This can be extended to support role-based access control
    next()
  }
}
