import { useState } from 'react'
import { Bell, Settings, Wallet, CheckCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWalletStore } from '@/store/walletStore'
import { truncateAddress } from '@/utils/format'
import WalletModal from './WalletModal'

export default function Header() {
  const { publicKey, isConnected, balance, disconnect } = useWalletStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Stellar Testnet
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {isConnected && publicKey ? (
            <div className="flex items-center gap-3 bg-gray-50 border rounded-lg px-3 py-1.5">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-900">
                  {balance.toFixed(2)} XLM
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  {truncateAddress(publicKey, 4, 4)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                title="Disconnect Wallet"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  )
}
