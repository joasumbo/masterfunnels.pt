import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './landing/Landing'

const Painel = lazy(() => import('./painel/Painel'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/painel/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-papel" />}>
              <Painel />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
