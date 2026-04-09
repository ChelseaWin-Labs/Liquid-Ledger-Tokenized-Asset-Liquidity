import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/utils/format'
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Assets() {
  const assets = [
    {
      id: 1,
      name: 'Gold Token',
      symbol: 'GLD',
      type: 'gold',
      price: 2469.12,
      change24h: 2.3,
      changePercent: 5.2,
      volume24h: 1234567,
      marketCap: 987654321,
      description: 'Tokenized gold backed by physical gold reserves',
      holdings: 45.678,
      value: 45678.90,
    },
    {
      id: 2,
      name: 'US Treasury',
      symbol: 'UST',
      type: 'treasury',
      price: 98.76,
      change24h: -0.12,
      changePercent: -0.4,
      volume24h: 2345678,
      marketCap: 1234567890,
      description: 'Tokenized US Treasury securities',
      holdings: 321.234,
      value: 32123.45,
    },
    {
      id: 3,
      name: 'Diversified Fund',
      symbol: 'DIV',
      type: 'fund',
      price: 2880.65,
      change24h: 15.23,
      changePercent: 1.9,
      volume24h: 3456789,
      marketCap: 4567890123,
      description: 'Diversified index fund tracking major markets',
      holdings: 476.305,
      value: 47630.54,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{formatCurrency(125432.89)}</div>
            <div className="text-sm text-gray-600">Total Portfolio Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{formatPercent(2.3)}</div>
            <div className="text-sm text-gray-600">24h Performance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{assets.length}</div>
            <div className="text-sm text-gray-600">Active Assets</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {asset.name}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({asset.symbol})
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{asset.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(asset.price)}</div>
                  <div className={`flex items-center text-sm ${
                    asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.change24h >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    {formatPercent(asset.changePercent)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Your Holdings</div>
                  <div className="font-medium">{asset.holdings} {asset.symbol}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Value</div>
                  <div className="font-medium">{formatCurrency(asset.value)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">24h Volume</div>
                  <div className="font-medium">{formatCurrency(asset.volume24h)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Market Cap</div>
                  <div className="font-medium">{formatCurrency(asset.marketCap)}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">Buy</Button>
                <Button variant="outline" className="flex-1">Sell</Button>
                <Button variant="outline" className="flex-1">Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
