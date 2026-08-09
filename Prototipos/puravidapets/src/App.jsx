import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SystemInfoModal from './components/SystemInfoModal'
import SocialFAB from './components/SocialFAB'
import Preloader from './components/Preloader'
import Home from './pages/Home'
import ClientDashboard from './pages/ClientDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AboutUs from './pages/AboutUs'
import Blog from './pages/Blog'
import Testimonials from './pages/Testimonials'
import FAQ from './pages/FAQ'
import Legal from './pages/Legal'
import Ecommerce from './pages/Ecommerce'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Onboarding from './pages/Auth/Onboarding'
import ForgotPassword from './pages/Auth/ForgotPassword'
import WalkerDashboard from './pages/WalkerDashboard'
import AssessorDashboard from './pages/AssessorDashboard'
import Prospects from './pages/Prospects'
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
          <Route path="/about" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/shop" element={<Ecommerce />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route path="/portal" element={<ClientDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/walker" element={<WalkerDashboard />} />
          <Route path="/assessor" element={<AssessorDashboard />} />
          <Route path="/prospects" element={<Prospects />} />
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
