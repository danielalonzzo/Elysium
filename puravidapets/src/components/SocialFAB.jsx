import { useState, useEffect } from 'react';
import { Plus, X, MessageCircle, Mail, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function SocialFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Close FAB when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.fab-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={22} className="text-white" />,
      href: 'https://wa.link/1slsaj',
      color: 'bg-[#25D366]',
    },
    {
      name: 'Instagram',
      icon: <InstagramIcon size={20} className="text-white" />,
      href: 'https://www.instagram.com/puravidapets.cr/',
      color: 'bg-[#E1306C]',
    },
    {
      name: 'Email',
      icon: <Mail size={20} className="text-white" />,
      href: 'mailto:info@puravidapets.cr',
      color: 'bg-[var(--color-brand-orange)]',
    },
  ];

  return (
    <div className="fab-container fixed bottom-8 right-8 z-[90] flex flex-col items-end gap-3">
      {/* Floating Options Group */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-1">
            {/* Social options deploying vertically upwards */}
            <div className="flex flex-col items-end gap-3">
              {socialLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 15 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-12 h-12 rounded-full ${link.color} flex items-center justify-center border-4 border-[var(--color-brand-dark)] shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,248,240,0.15)] hover:-translate-y-1 active:translate-y-0 transition-transform`}
                  title={link.name}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>

            {/* Utility Row deploying horizontally to the left of the bottom area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="flex items-center gap-3 pr-14 absolute bottom-0 right-0 h-12"
            >
              <button
                onClick={toggleTheme}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,248,240,0.15)] hover:-translate-y-1 active:translate-y-0 focus:outline-none ${
                  isDark 
                    ? 'bg-[#2D2D2D] text-amber-400 border-[#FFF8F0]' 
                    : 'bg-[#FFF8F0] text-[#2D2D2D] border-[#2D2D2D]'
                }`}
                title={isDark ? "Modo Claro" : "Modo Oscuro"}
              >
                {isDark ? (
                  <Sun size={20} className="text-amber-400" />
                ) : (
                  <Moon size={20} className="text-[#2D2D2D]" fill="#2D2D2D" />
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[var(--color-brand-orange)] text-white border-4 border-[var(--color-brand-dark)] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(45,45,45,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,248,240,0.15)] transition-transform hover:-translate-y-1 active:translate-y-0 focus:outline-none relative z-10"
        aria-label="Abrir redes y tema"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex items-center justify-center"
        >
          <Plus size={28} strokeWidth={3} />
        </motion.div>
      </button>
    </div>
  );
}
