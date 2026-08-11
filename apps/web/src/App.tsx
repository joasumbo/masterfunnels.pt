import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './landing/Landing'
import Painel from './painel/Painel'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/painel/*" element={<Painel />} />
      </Routes>
    </BrowserRouter>
  )
}
