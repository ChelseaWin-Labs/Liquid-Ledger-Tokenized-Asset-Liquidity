import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

export default function Transactions() {
  const transactions = [
    {
      id: 1,
      type: 'buy',
      asset: 'Gold Token',
      amount: 0.5,
      price: 2469.12,
      totalValue: 1234.56,
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z',
      hash: 'abc123...'
    },
    {
      id: 2,
      type: 'spend',
      asset: 'US Treasury',
      amount: 100,
      price: 98.76,
      totalValue: 9876.54,
      status: 'completed',
      createdAt: '2024-01-15T08:15:00Z',
      hash: 'def456...'
    },
    {
      id: 3,
      type: 'sell',
      asset: 'Diversified Fund',
      amount: 1.2,
      price: 2880.65,
      totalValue: 3456.78,
      status: 'pending',
      createdAt: '2024-01-14T16:45:00Z',
      hash: 'ghi789...'
    },
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowDownRight className="h-4 w-4 text-green-600" />
      case 'sell':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'spend':
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-600" />
      default:
        return <ArrowRight className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <Button>Export Transactions</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">142</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">6</div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <div className="font-medium capitalize">{tx.type} {tx.asset}</div>
                    <div className="text-sm text-gray-600">
                      {tx.amount} {tx.asset} @ {formatCurrency(tx.price)}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(tx.totalValue)}</div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
