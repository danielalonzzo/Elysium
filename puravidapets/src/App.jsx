import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SystemInfoModal from './components/SystemInfoModal'
import SocialFAB from './components/SocialFAB'
import Preloader from './components/Preloader'
import Home from './pages/Home'
import ClientDashboard from './pages/ClientDashboard'

function App() {
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Preloader — same anti-flicker architecture as Elysium λ */}
      <Preloader />

      <div className="blob-bg w-[800px] h-[800px] -top-96 -left-40 animate-[morph_12s_ease-in-out_infinite]"></div>
      <div className="blob-bg w-[600px] h-[600px] top-1/2 -right-64 animate-[morph_15s_ease-in-out_infinite]"></div>
      
      <Navbar />
      
      <main className="flex-grow pt-28">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portal" element={<ClientDashboard />} />
        </Routes>
      </main>

      <Footer onOpenModal={() => setIsSystemInfoOpen(true)} />

      {/* Floating Action Button for social quicklinks & dark mode */}
      <SocialFAB />

      {/* Modal rendered at root level — above everything including Navbar */}
      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  )
}

export default App
