import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, truncateAddress } from '@/utils/format'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ArrowUpDown, CreditCard, ShieldCheck } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import TradeModal, { TradeAsset } from '@/components/TradeModal'
import WalletModal from '@/components/WalletModal'

export default function Dashboard() {
  const { isConnected, publicKey, balance } = useWalletStore()
  const [selectedAsset, setSelectedAsset] = useState<TradeAsset | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  const defaultAssets: TradeAsset[] = [
    { id: '1', name: 'Liquid Ledger Gold', symbol: 'GLD', currentPrice: 65.40, priceChange24h: 1.25, holdings: 25.5 },
    { id: '2', name: 'Liquid Ledger US Treasury', symbol: 'UST', currentPrice: 100.15, priceChange24h: 0.05, holdings: 1500.0 },
    { id: '3', name: 'Liquid Ledger Diversified Fund', symbol: 'DIV', currentPrice: 245.80, priceChange24h: -0.42, holdings: 10.0 },
  ]

  const totalPortfolioValue = defaultAssets.reduce(
    (acc, asset) => acc + (asset.holdings || 0) * asset.currentPrice,
    0
  )

  const handleOpenTrade = (asset: TradeAsset) => {
    setSelectedAsset(asset)
    setTradeModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Portfolio Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tokenized asset liquidity on Stellar Soroban
          </p>
        </div>
        {!isConnected ? (
          <Button
            onClick={() => setWalletModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Connect Freighter Wallet
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Connected: {truncateAddress(publicKey || '', 4, 4)} ({balance.toFixed(2)} XLM)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total RWA Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900">
              {formatCurrency(totalPortfolioValue)}
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-600 mt-1">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +2.34% ($3,540.20) in past 24h
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Daily Settlement Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-gray-900">
              {formatCurrency(142580.40)}
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +14.8% institutional volume
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Debit Card Liquidity Buffer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-600">
              {formatCurrency(25000.00)}
            </div>
            <div className="flex items-center text-xs font-medium text-gray-500 mt-1">
              <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
              Ready for real-time POS liquidation
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Your Real-World Assets</h2>
          <span className="text-xs text-gray-500">Stellar Soroban Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Spot Price</th>
                <th className="py-3 px-4">24h Change</th>
                <th className="py-3 px-4">Your Holding</th>
                <th className="py-3 px-4">USD Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {defaultAssets.map((asset) => {
                const holdingValue = (asset.holdings || 0) * asset.currentPrice
                const isPositive = asset.priceChange24h >= 0
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{asset.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{asset.symbol}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {formatCurrency(asset.currentPrice)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-medium ${
                          isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                        )}
                        {formatPercent(asset.priceChange24h)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-mono text-sm">
                      {asset.holdings?.toFixed(2)} {asset.symbol}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {formatCurrency(holdingValue)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTrade(asset)}
                        className="text-xs font-medium hover:bg-blue-50 hover:text-blue-600 border-gray-300"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                        Trade
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        asset={selectedAsset}
      />
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </div>
  )
}
