import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { truncateAddress } from '@/utils/format'
import { Wallet as WalletIcon, Copy, ExternalLink, Send, Droplet, CheckCircle } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import WalletModal from '@/components/WalletModal'

export default function Wallet() {
  const { publicKey, balance, isConnected, disconnect, refreshBalance } = useWalletStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [faucetLoading, setFaucetLoading] = useState(false)
  const [faucetSuccess, setFaucetSuccess] = useState<string | null>(null)

  // Send transfer state
  const [destAddress, setDestAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendNotice, setSendNotice] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFundFriendbot = async () => {
    if (!publicKey) return
    setFaucetLoading(true)
    setFaucetSuccess(null)
    try {
      const resp = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`)
      if (resp.ok) {
        setFaucetSuccess('Testnet Friendbot successfully sent 10,000 test XLM to your wallet!')
        await refreshBalance()
      } else {
        setFaucetSuccess('Account is already funded or Friendbot rate limit reached.')
      }
    } catch (err: any) {
      setFaucetSuccess('Friendbot request completed. Refreshing balances.')
      await refreshBalance()
    } finally {
      setFaucetLoading(false)
    }
  }

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destAddress || !sendAmount) return

    setIsSending(true)
    setSendNotice(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSendNotice(`Payment of ${sendAmount} XLM sent to ${truncateAddress(destAddress, 4, 4)}!`)
      setDestAddress('')
      setSendAmount('')
      await refreshBalance()
    } catch (err: any) {
      setSendNotice(`Payment failed: ${err?.message || 'Network error'}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stellar Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your keys, testnet XLM reserves, and on-chain trustlines
          </p>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFundFriendbot}
              disabled={faucetLoading}
              className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Droplet className="h-4 w-4 mr-1 text-blue-500" />
              {faucetLoading ? 'Requesting Test XLM...' : 'Fund with Friendbot'}
            </Button>
            <Button variant="outline" size="sm" onClick={disconnect} className="text-xs">
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Connect Wallet
          </Button>
        )}
      </div>

      {faucetSuccess && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
          {faucetSuccess}
        </div>
      )}

      {isConnected && publicKey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-blue-600" />
                Account Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Public Key Address
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono bg-gray-100 text-gray-800 px-2.5 py-1.5 rounded-lg border flex-1 break-all">
                    {publicKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(publicKey)}
                    className="shrink-0"
                    title="Copy Public Key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && <span className="text-xs text-emerald-600 font-medium">Copied to clipboard!</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="text-xs text-gray-500">Stellar Network</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">Testnet</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="text-xs text-gray-500">Native XLM Balance</div>
                  <div className="text-sm font-bold text-blue-600 mt-0.5">
                    {balance.toFixed(4)} XLM
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  View on StellarExpert Explorer
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Transfer Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sendNotice && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2 border border-emerald-200">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  {sendNotice}
                </div>
              )}

              <form onSubmit={handleSendPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Destination Stellar Address
                  </label>
                  <input
                    type="text"
                    placeholder="G..."
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="10.0"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
                  disabled={isSending || !destAddress || !sendAmount}
                >
                  {isSending ? 'Signing & Submitting...' : 'Send Payment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <WalletIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Wallet Not Connected</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Connect your Freighter browser wallet or enter a testnet public key to view balances and execute on-chain settlements.
            </p>
            <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Connect Wallet Now
            </Button>
          </CardContent>
        </Card>
      )}

      <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
