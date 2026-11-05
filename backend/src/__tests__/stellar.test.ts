import { stellarService } from '../services/stellarService'
import { Keypair } from 'stellar-sdk'

describe('StellarService Unit Tests', () => {
  it('should initialize with testnet network passphrase by default', () => {
    const passphrase = stellarService.getNetworkPassphrase()
    expect(passphrase).toContain('Test SDF Network')
  })

  it('should generate valid trustline transaction XDR', async () => {
    const randomKeypair = Keypair.random()
    const issuerKeypair = Keypair.random()

    // Mock loadAccount on the internal server instance
    const mockAccount = {
      accountId: () => randomKeypair.publicKey(),
      sequenceNumber: () => '100',
      incrementSequenceNumber: () => {},
    }
    ;(stellarService as any).server.loadAccount = jest.fn().mockResolvedValue(mockAccount)

    const xdr = await stellarService.buildTrustlineTransaction(
      randomKeypair.publicKey(),
      'GLD',
      issuerKeypair.publicKey()
    )

    expect(typeof xdr).toBe('string')
    expect(xdr.length).toBeGreaterThan(20)
  })

  it('should generate valid payment transaction XDR', async () => {
    const sender = Keypair.random()
    const recipient = Keypair.random()

    const mockAccount = {
      accountId: () => sender.publicKey(),
      sequenceNumber: () => '101',
      incrementSequenceNumber: () => {},
    }
    ;(stellarService as any).server.loadAccount = jest.fn().mockResolvedValue(mockAccount)

    const xdr = await stellarService.buildPaymentTransaction(
      sender.publicKey(),
      recipient.publicKey(),
      'XLM',
      '',
      '50.0',
      'Test payment'
    )

    expect(typeof xdr).toBe('string')
    expect(xdr.length).toBeGreaterThan(20)
  })
})
