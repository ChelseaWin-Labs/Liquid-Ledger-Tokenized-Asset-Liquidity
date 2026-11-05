import React, { useState } from 'react'
import { useWalletStore } from '@/store/walletStore'
import { Button } from '@/components/ui/button'
import { Wallet, Key, AlertCircle } from 'lucide-react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectWithKey, isConnecting, error } = useWalletStore()
  const [manualKey, setManualKey] = useState('')
  const [activeTab, setActiveTab] = useState<'freighter' | 'manual'>('freighter')

  if (!isOpen) return null

  const handleFreighterConnect = async () => {
    await connect()
    onClose()
  }

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualKey.trim().startsWith('G') || manualKey.trim().length !== 56) {
      alert('Invalid Stellar public key format. Must start with G and be 56 characters.')
      return
    }
    await connectWithKey(manualKey.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            Connect Stellar Wallet
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex border-b border-gray-100 mt-4">
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'freighter'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('freighter')}
          >
            Freighter Extension
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            Stellar Public Key
          </button>
        </div>

        {activeTab === 'freighter' ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Browser Extension</h4>
              <p className="text-xs text-gray-500 mt-1">
                Connect via official Freighter browser wallet or continue with demo testnet credentials.
              </p>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleFreighterConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Requesting Access...' : 'Connect Freighter'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleManualConnect} className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Stellar Public Key (starts with G)
              </label>
              <input
                type="text"
                placeholder="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!manualKey || isConnecting}
            >
              <Key className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
