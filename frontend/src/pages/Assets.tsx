import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/format'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import TradeModal, { TradeAsset } from '@/components/TradeModal'

export interface ExtendedAsset extends TradeAsset {
  type: 'gold' | 'treasury' | 'fund'
  volume24h: number
  marketCap: number
  description: string
  contractId: string
  yieldBps: number
}

export default function Assets() {
  const [selectedAsset, setSelectedAsset] = useState<TradeAsset | null>(null)
  const [modalMode, setModalMode] = useState<'BUY' | 'SELL'>('BUY')
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const assets: ExtendedAsset[] = [
    {
      id: 'gld-1',
      name: 'Liquid Ledger Gold Token',
      symbol: 'GLD',
      type: 'gold',
      currentPrice: 65.40,
      priceChange24h: 1.25,
      volume24h: 1254000,
      marketCap: 654000000,
      description: 'Physical allocated LBMA-grade gold bullion in insured Swiss vaults.',
      holdings: 25.5,
      contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      yieldBps: 0,
    },
    {
      id: 'ust-1',
      name: 'Liquid Ledger US Treasury 3M',
      symbol: 'UST',
      type: 'treasury',
      currentPrice: 100.15,
      priceChange24h: 0.05,
      volume24h: 4890000,
      marketCap: 5007500000,
      description: 'Short-duration US Treasury Bills with automated compounding daily yield.',
      holdings: 1500.0,
      contractId: 'CBEFD7FXYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYAA',
      yieldBps: 520, // 5.20% APY
    },
    {
      id: 'div-1',
      name: 'Liquid Ledger Diversified Fund',
      symbol: 'DIV',
      type: 'fund',
      currentPrice: 245.80,
      priceChange24h: -0.42,
      volume24h: 2130000,
      marketCap: 6145000000,
      description: 'Balanced basket of tokenized real estate, private credit, and blue-chip equities.',
      holdings: 10.0,
      contractId: 'CAEFB4FXYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYBB',
      yieldBps: 780, // 7.80% APY
    },
  ]

  const filtered = filterType === 'all'
    ? assets
    : assets.filter((a) => a.type === filterType)

  const handleOpen = (asset: ExtendedAsset, mode: 'BUY' | 'SELL') => {
    setSelectedAsset(asset)
    setModalMode(mode)
    setIsTradeOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Institutional RWAs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compliant, yield-bearing Real-World Assets tokenized on Stellar Soroban
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {['all', 'gold', 'treasury', 'fund'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                filterType === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filtered.map((asset) => {
          const isPositive = asset.priceChange24h >= 0
          return (
            <Card key={asset.id} className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 uppercase">
                    {asset.symbol}
                  </span>
                  {asset.yieldBps > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(asset.yieldBps / 100).toFixed(2)}% APY
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-2">
                  {asset.name}
                </CardTitle>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                  {asset.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-baseline pt-2 border-t">
                  <span className="text-xs text-gray-500 font-medium">Spot Price</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(asset.currentPrice)}
                    </span>
                    <div
                      className={`flex items-center justify-end text-xs font-medium ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                      )}
                      {formatPercent(asset.priceChange24h)} (24h)
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5 border">
                  <div className="flex justify-between">
                    <span className="text-gray-500">24h Volume</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(asset.volume24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Market Cap</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(asset.marketCap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your Holding</span>
                    <span className="font-semibold text-blue-600 font-mono">
                      {asset.holdings?.toFixed(2)} {asset.symbol} ({formatCurrency((asset.holdings || 0) * asset.currentPrice)})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    onClick={() => handleOpen(asset, 'BUY')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
                    size="sm"
                  >
                    Buy {asset.symbol}
                  </Button>
                  <Button
                    onClick={() => handleOpen(asset, 'SELL')}
                    variant="outline"
                    className="w-full border-gray-300 font-medium text-xs hover:bg-gray-50"
                    size="sm"
                  >
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        asset={selectedAsset}
        initialMode={modalMode}
      />
    </div>
  )
}
