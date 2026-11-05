import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCrypto,
  formatPercent,
  formatNumber,
  truncateAddress,
} from '../utils/format'

describe('Frontend Formatter Utilities', () => {
  it('should format USD currency values correctly', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('should format crypto amounts to specified precision', () => {
    expect(formatCrypto(12.3456789, 4)).toBe('12.3457')
    expect(formatCrypto(100, 2)).toBe('100.00')
  })

  it('should format percent with proper signs', () => {
    expect(formatPercent(5.2)).toBe('+5.20%')
    expect(formatPercent(-0.45)).toBe('-0.45%')
    expect(formatPercent(0)).toBe('+0.00%')
  })

  it('should format numbers with standard thousand separators', () => {
    expect(formatNumber(1540200)).toBe('1,540,200')
  })

  it('should truncate Stellar account addresses accurately', () => {
    const pubKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    expect(truncateAddress(pubKey, 4, 4)).toBe('GBBD...FLA5')
    expect(truncateAddress(pubKey, 6, 6)).toBe('GBBD47...LLFLA5')
    expect(truncateAddress('short', 4, 4)).toBe('short')
  })
})

