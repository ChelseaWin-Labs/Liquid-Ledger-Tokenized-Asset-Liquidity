import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'

describe('Backend Auth & Security Unit Tests', () => {
  it('should securely hash and verify user passwords', async () => {
    const rawPassword = 'SecretPassword123!'
    const saltRounds = 10
    const hash = await bcrypt.hash(rawPassword, saltRounds)

    expect(hash).not.toEqual(rawPassword)
    const isMatch = await bcrypt.compare(rawPassword, hash)
    expect(isMatch).toBe(true)

    const isWrong = await bcrypt.compare('WrongPassword!', hash)
    expect(isWrong).toBe(false)
  })

  it('should generate and verify valid JWT tokens using config secret', () => {
    const payload = { userId: 'usr_test_123', email: 'test@liquidledger.finance' }
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' })

    const decoded = jwt.verify(token, config.jwtSecret) as any
    expect(decoded.userId).toBe(payload.userId)
    expect(decoded.email).toBe(payload.email)
  })

  it('should reject tampered or expired JWT tokens', () => {
    const payload = { userId: 'usr_test_123' }
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1ms' })

    expect(() => {
      jwt.verify(token, 'wrong_secret')
    }).toThrow()
  })
})
