import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Wallet from '@/pages/Wallet'
import Transactions from '@/pages/Transactions'
import Assets from '@/pages/Assets'
import Card from '@/pages/Card'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="assets" element={<Assets />} />
          <Route path="card" element={<Card />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
