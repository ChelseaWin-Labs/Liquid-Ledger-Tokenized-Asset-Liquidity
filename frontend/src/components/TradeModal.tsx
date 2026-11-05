import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useWalletStore } from '@/store/walletStore'
import { formatCurrency } from '@/utils/format'
import { ArrowUpDown, CheckCircle, AlertCircle } from 'lucide-react'

export interface TradeAsset {
  id: string
  name: string
  symbol: string
  currentPrice: number
  priceChange24h: number
  holdings?: number
}

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  asset: TradeAsset | null
  initialMode?: 'BUY' | 'SELL'
  onSuccess?: () => void
}

export default function TradeModal({
  isOpen,
  onClose,
  asset,
  initialMode = 'BUY',
  onSuccess,
}: TradeModalProps) {
  const { isConnected, refreshBalance } = useWalletStore()
  const [mode, setMode] = useState<'BUY' | 'SELL'>(initialMode)
  const [amount, setAmount] = useState<string>('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  if (!isOpen || !asset) return null

  const parsedAmount = parseFloat(amount) || 0
  const totalUsd = parsedAmount * asset.currentPrice
  const estimatedFee = totalUsd * 0.001 // 0.1%

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedAmount <= 0) return

    setIsSubmitting(true)
    setIsError(false)
    setStatusMessage(null)

    try {
      // Simulate or call backend endpoint
      await new Promise((resolve) => setTimeout(resolve, 800))

      setStatusMessage(
        `Successfully ${mode === 'BUY' ? 'purchased' : 'sold'} ${parsedAmount} ${asset.symbol} for ${formatCurrency(totalUsd)}!`
      )
      setIsError(false)
      await refreshBalance()
      if (onSuccess) onSuccess()

      setTimeout(() => {
        onClose()
        setStatusMessage(null)
      }, 1500)
    } catch (err: any) {
      setIsError(true)
      setStatusMessage(err?.message || 'Transaction could not be completed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Trade {asset.name} ({asset.symbol})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
          >
            ✕
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              isError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isError ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 shrink-0" />
            )}
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            className={`py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'BUY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMode('BUY')}
          >
            Buy {asset.symbol}
          </button>
          <button
            type="button"
            className={`py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'SELL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setMode('SELL')}
          >
            Sell {asset.symbol}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Spot Price:</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(asset.currentPrice)}
              </span>
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount ({asset.symbol})
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-2 border">
            <div className="flex justify-between">
              <span className="text-gray-500">Gross Total:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totalUsd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Protocol Fee (0.1%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(estimatedFee)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span className="text-gray-800">Net Estimated:</span>
              <span className="text-blue-600">
                {formatCurrency(
                  mode === 'BUY' ? totalUsd + estimatedFee : totalUsd - estimatedFee
                )}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={isSubmitting || parsedAmount <= 0}
          >
            {isSubmitting
              ? 'Executing on Stellar...'
              : `${mode === 'BUY' ? 'Confirm Buy Order' : 'Confirm Sell Order'}`}
          </Button>
        </form>
      </div>
    </div>
  )
}
