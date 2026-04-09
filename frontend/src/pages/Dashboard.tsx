import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/format'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard() {
  const portfolioValue = 125432.89
  const dailyChange = 2345.67
  const dailyChangePercent = 1.91

  const assets = [
    { name: 'Gold Token', symbol: 'GLD', value: 45678.90, change: 2.3, changePercent: 5.2 },
    { name: 'US Treasury', symbol: 'UST', value: 32123.45, change: -123.45, changePercent: -0.4 },
    { name: 'Diversified Fund', symbol: 'DIV', value: 47630.54, change: 892.12, changePercent: 1.9 },
  ]

  const recentTransactions = [
    { id: 1, type: 'buy', asset: 'Gold Token', amount: 0.5, value: 1234.56, time: '2 hours ago' },
    { id: 2, type: 'spend', asset: 'US Treasury', amount: 100, value: 9876.54, time: '5 hours ago' },
    { id: 3, type: 'sell', asset: 'Diversified Fund', amount: 1.2, value: 3456.78, time: '1 day ago' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button>Connect Wallet</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
            <div className={`flex items-center text-sm ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dailyChange >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {formatCurrency(Math.abs(dailyChange))} ({formatPercent(dailyChangePercent)})
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Daily Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(89234.56)}</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <div className="text-sm text-gray-600">3 tokenized assets</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-gray-600">{asset.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(asset.value)}</div>
                    <div className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change >= 0 ? '+' : ''}{formatPercent(asset.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{tx.type} {tx.asset}</div>
                    <div className="text-sm text-gray-600">{tx.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(tx.value)}</div>
                    <div className="text-sm text-gray-600">{tx.amount} {tx.asset}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
