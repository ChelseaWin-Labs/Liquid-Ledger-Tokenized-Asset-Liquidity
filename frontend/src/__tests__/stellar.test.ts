import { describe, it, expect } from 'vitest'
import { stellarClient } from '../services/stellar'

describe('Frontend Stellar Client', () => {
  it('should be instantiated and provide account loader', () => {
    expect(stellarClient).toBeDefined()
    expect(typeof stellarClient.getAccount).toBe('function')
    expect(typeof stellarClient.connectWallet).toBe('function')
  })

  it('should load account and return valid structure', async () => {
    const demoKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    const account = await stellarClient.getAccount(demoKey)

    expect(account.publicKey).toBe(demoKey)
    expect(typeof account.balance).toBe('number')
    expect(Array.isArray(account.assets)).toBe(true)
  })
})
