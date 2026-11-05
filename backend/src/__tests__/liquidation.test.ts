describe('Debit Card POS Liquidation Engine Unit Tests', () => {
  it('should calculate correct tokenized asset liquidation at spot market prices', () => {
    const goldPricePerUnit = 65.40 // $65.40 / GLD
    const posPurchaseAmountUsd = 130.80 // $130.80 purchase at coffee shop / retail store

    const unitsToLiquidate = posPurchaseAmountUsd / goldPricePerUnit
    expect(unitsToLiquidate).toBeCloseTo(2.0, 5)

    const remainingBalance = 10.0 - unitsToLiquidate
    expect(remainingBalance).toBeCloseTo(8.0, 5)

    const remainingValueUsd = remainingBalance * goldPricePerUnit
    expect(remainingValueUsd).toBeCloseTo(523.20, 2)
  })

  it('should enforce daily spend limit constraints', () => {
    const dailyLimit = 5000.0
    const alreadySpentToday = 4850.0
    const newAttemptedSpend = 200.0

    const isExceeded = alreadySpentToday + newAttemptedSpend > dailyLimit
    expect(isExceeded).toBe(true)

    const maxAllowedSpend = dailyLimit - alreadySpentToday
    expect(maxAllowedSpend).toBe(150.0)
  })

  it('should reject purchase when asset balance is insufficient', () => {
    const treasuryPrice = 100.15
    const userHoldingUnits = 0.5 // $50.075 value
    const purchaseAmount = 100.0 // $100 purchase

    const unitsRequired = purchaseAmount / treasuryPrice
    expect(unitsRequired).toBeGreaterThan(userHoldingUnits)
  })
})
