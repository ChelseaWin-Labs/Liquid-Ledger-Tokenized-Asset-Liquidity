import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

// Import routes
import authRoutes from './controllers/authController'
import userRoutes from './controllers/userController'
import assetRoutes from './controllers/assetController'
import transactionRoutes from './controllers/transactionController'
import walletRoutes from './controllers/walletController'
import cardRoutes from './controllers/cardController'

// Import middleware & config
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import { config } from './config/env'

const app = express()

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true)
      if (config.frontendUrls.indexOf(origin) !== -1 || config.env === 'development') {
        return callback(null, true)
      }
      return callback(new Error('Blocked by CORS policy'))
    },
    credentials: true,
  })
)
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/cards', cardRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server if not running in test mode
if (config.env !== 'test') {
  app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`)
    logger.info(`Environment: ${config.env}`)
  })
}

export default app
