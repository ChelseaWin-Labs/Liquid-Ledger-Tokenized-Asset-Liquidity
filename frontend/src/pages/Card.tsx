import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { CreditCard, Eye, EyeOff, Lock, Unlock, ShoppingBag, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

interface CardTx {
  id: string
  merchant: string
  amount: number
  assetSymbol: string
  liquidatedUnits: number
  time: string
}

export default function CardPage() {
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [dailyLimit, setDailyLimit] = useState(5000)
  const [spentToday, setSpentToday] = useState(148.50)

  // POS Spend Simulator State
  const [simMerchant, setSimMerchant] = useState('Apple Store')
  const [simAmount, setSimAmount] = useState('79.99')
  const [simAsset, setSimAsset] = useState<'GLD' | 'UST' | 'DIV'>('GLD')
  const [isSimulating, setIsSimulating] = useState(false)
  const [posSuccess, setPosSuccess] = useState<string | null>(null)
  const [posError, setPosError] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<CardTx[]>([
    { id: '1', merchant: 'Whole Foods Market', amount: 123.45, assetSymbol: 'GLD', liquidatedUnits: 1.8876, time: '2 hours ago' },
    { id: '2', merchant: 'Uber Technologies', amount: 25.05, assetSymbol: 'UST', liquidatedUnits: 0.2501, time: '5 hours ago' },
  ])

  const assetPrices = {
    GLD: 65.40,
    UST: 100.15,
    DIV: 245.80,
  }

  const handleSimulateSpend = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosSuccess(null)
    setPosError(null)

    if (isFrozen) {
      setPosError('Transaction declined: Debit card is currently frozen.')
      return
    }

    const amt = parseFloat(simAmount)
    if (!amt || amt <= 0) return

    if (spentToday + amt > dailyLimit) {
      setPosError(`Transaction declined: Daily limit of ${formatCurrency(dailyLimit)} exceeded.`)
      return
    }

    setIsSimulating(true)
    await new Promise((r) => setTimeout(r, 600))

    const spotPrice = assetPrices[simAsset]
    const units = amt / spotPrice

    const newTx: CardTx = {
      id: Date.now().toString(),
      merchant: simMerchant,
      amount: amt,
      assetSymbol: simAsset,
      liquidatedUnits: units,
      time: 'Just now',
    }

    setTransactions([newTx, ...transactions])
    setSpentToday((prev) => prev + amt)
    setPosSuccess(
      `Approved $${amt.toFixed(2)} at ${simMerchant}. Automatically liquidated ${units.toFixed(4)} ${simAsset} at $${spotPrice}/unit.`
    )
    setIsSimulating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Liquid Debit Card</h1>
          <p className="text-sm text-gray-500 mt-1">
            Spend your tokenized real-world assets anywhere Visa & Mastercard are accepted
          </p>
        </div>
        <Button
          variant={isFrozen ? 'destructive' : 'outline'}
          onClick={() => setIsFrozen(!isFrozen)}
          className="text-xs font-semibold flex items-center gap-2"
        >
          {isFrozen ? (
            <>
              <Unlock className="h-4 w-4" /> Unfreeze Card
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" /> Freeze Card
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical / Digital Card Preview */}
        <div className="space-y-6">
          <div
            className={`relative rounded-2xl p-6 text-white shadow-xl overflow-hidden transition-all duration-300 ${
              isFrozen
                ? 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 opacity-80'
                : 'bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900'
            }`}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-xs tracking-widest uppercase font-semibold text-blue-200">
                  Liquid Ledger Prime
                </span>
                <div className="text-sm font-light mt-0.5 opacity-90">RWA Liquidity Card</div>
              </div>
              <div className="text-lg font-bold tracking-wider uppercase">VISA</div>
            </div>

            <div className="my-6">
              <div className="font-mono text-xl tracking-widest">
                {showCardNumber ? '4242 •••• •••• 9812' : '•••• •••• •••• 9812'}
              </div>
              <button
                onClick={() => setShowCardNumber(!showCardNumber)}
                className="mt-2 text-xs flex items-center gap-1 text-blue-200 hover:text-white"
              >
                {showCardNumber ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showCardNumber ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="flex justify-between items-end text-xs opacity-90 font-mono">
              <div>
                <div className="text-[10px] uppercase opacity-75">Cardholder</div>
                <div className="font-semibold text-sm">ALEX VANCE</div>
              </div>
              <div>
                <div className="text-[10px] uppercase opacity-75">Expires</div>
                <div className="font-semibold text-sm">12/28</div>
              </div>
              <div>
                <div className="text-[10px] uppercase opacity-75">Status</div>
                <div className="font-semibold uppercase">{isFrozen ? 'Frozen' : 'Active'}</div>
              </div>
            </div>
          </div>

          {/* Daily Limit Bar */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Daily Spending Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Spent today: {formatCurrency(spentToday)}</span>
                <span>Limit: {formatCurrency(dailyLimit)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (spentToday / dailyLimit) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* POS Spend Simulator Form */}
        <Card className="shadow-sm border-blue-100 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Interactive POS Spend Simulator
            </CardTitle>
            <p className="text-xs text-gray-500">
              Simulate a real-time merchant terminal swipe. The protocol instantly liquidates backing RWAs at spot market price.
            </p>
          </CardHeader>
          <CardContent>
            {posSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                {posSuccess}
              </div>
            )}
            {posError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                {posError}
              </div>
            )}

            <form onSubmit={handleSimulateSpend} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={simMerchant}
                  onChange={(e) => setSimMerchant(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Liquidate Asset
                  </label>
                  <select
                    value={simAsset}
                    onChange={(e) => setSimAsset(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="GLD">Gold (GLD) @ $65.40</option>
                    <option value="UST">US Treasury (UST) @ $100.15</option>
                    <option value="DIV">Diversified Fund (DIV) @ $245.80</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600 border">
                <div className="flex justify-between">
                  <span>Estimated Units to Burn:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {((parseFloat(simAmount) || 0) / assetPrices[simAsset]).toFixed(4)} {simAsset}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Speed:</span>
                  <span className="text-emerald-600 font-semibold">Instant (Soroban sub-second)</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2"
                disabled={isSimulating}
              >
                <ShoppingBag className="h-4 w-4" />
                {isSimulating ? 'Authorizing & Liquidating...' : 'Swipe Card (Simulate Spend)'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Card Transactions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Recent Debit Card Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{tx.merchant}</div>
                  <div className="text-xs text-gray-500">
                    Liquidated {tx.liquidatedUnits.toFixed(4)} {tx.assetSymbol} • {tx.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 text-sm">
                    -{formatCurrency(tx.amount)}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Settled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
