import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, truncateAddress } from '@/utils/format'
import { Wallet as WalletIcon, Copy, ExternalLink } from 'lucide-react'

export default function Wallet() {
  const publicKey = "GDUKJHGJDSGHJDSGHJDSGHJDSGHJDSGHJDSGHJDSGHJDSGHJDSGHJD"
  const balance = 125432.89
  const isConnected = true

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        {isConnected ? (
          <Button variant="outline">Disconnect</Button>
        ) : (
          <Button>Connect Wallet</Button>
        )}
      </div>

      {isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <WalletIcon className="h-5 w-5 mr-2" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600">Public Key</div>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {truncateAddress(publicKey, 8, 8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(publicKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-600">Network</div>
                <div className="mt-1">Stellar Testnet</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600">Total Balance</div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(balance)}</div>
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Stellar Explorer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                Send Assets
              </Button>
              <Button className="w-full" variant="outline">
                Receive Assets
              </Button>
              <Button className="w-full" variant="outline">
                Swap Assets
              </Button>
              <Button className="w-full" variant="outline">
                Transaction History
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WalletIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Connected</h3>
            <p className="text-gray-600 text-center mb-6">
              Connect your Stellar wallet to start managing your tokenized assets
            </p>
            <Button>Connect Wallet</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Asset Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Gold Token (GLD)</div>
                <div className="text-sm text-gray-600">Tokenized Gold</div>
              </div>
              <div className="text-right">
                <div className="font-medium">45.678 GLD</div>
                <div className="text-sm text-gray-600">{formatCurrency(45678.90)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">US Treasury (UST)</div>
                <div className="text-sm text-gray-600">Tokenized Treasuries</div>
              </div>
              <div className="text-right">
                <div className="font-medium">321.234 UST</div>
                <div className="text-sm text-gray-600">{formatCurrency(32123.45)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">Diversified Fund (DIV)</div>
                <div className="text-sm text-gray-600">Index Fund Token</div>
              </div>
              <div className="text-right">
                <div className="font-medium">476.305 DIV</div>
                <div className="text-sm text-gray-600">{formatCurrency(47630.54)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
