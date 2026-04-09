import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/format'
import { CreditCard, Plus, Settings, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function Card() {
  const [showCardNumber, setShowCardNumber] = useState(false)
  
  const card = {
    id: 1,
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isActive: true,
    dailyLimit: 5000,
    monthlyLimit: 15000,
    dailySpent: 1234.56,
    monthlySpent: 8923.45,
  }

  const recentTransactions = [
    { merchant: 'Whole Foods', amount: 123.45, asset: 'Gold Token', time: '2 hours ago' },
    { merchant: 'Amazon', amount: 89.99, asset: 'US Treasury', time: '5 hours ago' },
    { merchant: 'Starbucks', amount: 12.50, asset: 'Diversified Fund', time: '1 day ago' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Debit Card</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Your Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm opacity-75">Liquid Ledger</div>
                <div className="text-sm font-medium uppercase">{card.brand}</div>
              </div>
              <div className="mb-6">
                <div className="text-lg tracking-wider">
                  {showCardNumber ? '**** **** **** 4242' : '**** **** **** ****'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 mt-2"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                >
                  {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-75">Expires</div>
                  <div className="text-sm">
                    {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-75">Status</div>
                  <div className={`text-sm font-medium ${card.isActive ? 'text-green-300' : 'text-red-300'}`}>
                    {card.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daily Limit</span>
                <span className="text-sm font-medium">{formatCurrency(card.dailyLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daily Spent</span>
                <span className="text-sm font-medium">{formatCurrency(card.dailySpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Limit</span>
                <span className="text-sm font-medium">{formatCurrency(card.monthlyLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Spent</span>
                <span className="text-sm font-medium">{formatCurrency(card.monthlySpent)}</span>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" className="flex-1">
                Freeze Card
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Daily Spending Limit</label>
              <div className="mt-1">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={card.dailyLimit}
                  readOnly
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Monthly Spending Limit</label>
              <div className="mt-1">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={card.monthlyLimit}
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Preferred Asset for Spending</label>
              <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
                <option>Gold Token (GLD)</option>
                <option>US Treasury (UST)</option>
                <option>Diversified Fund (DIV)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="auto-sell" className="rounded" />
              <label htmlFor="auto-sell" className="text-sm text-gray-700">
                Auto-sell assets when spending
              </label>
            </div>

            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Card Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{tx.merchant}</div>
                  <div className="text-sm text-gray-600">Paid with {tx.asset}</div>
                  <div className="text-xs text-gray-500">{tx.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(tx.amount)}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
