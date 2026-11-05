import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

declare global {
  var __prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Log Prisma events
(prisma as any).$on('query', (e: any) => {
  logger.debug('Query: ' + e.query)
  logger.debug('Params: ' + e.params)
  logger.debug('Duration: ' + e.duration + 'ms')
})

(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma Error: ' + e.message)
})

(prisma as any).$on('info', (e: any) => {
  logger.info('Prisma Info: ' + e.message)
})

(prisma as any).$on('warn', (e: any) => {
  logger.warn('Prisma Warning: ' + e.message)
})

// Test database connection
const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error('Database disconnection error:', error)
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDB()
  process.exit(0)
})

export { prisma, connectDB, disconnectDB }
