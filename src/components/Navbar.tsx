// src/components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Chargement du thème sauvegardé au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-[#0f766e] dark:text-teal-400 tracking-tight">
          Milele4Ever.
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center gap-10 text-lg">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-[#0f766e] dark:hover:text-teal-400 transition">Accueil</Link>
          <Link href="/messages" className="text-gray-700 dark:text-gray-300 hover:text-[#0f766e] dark:hover:text-teal-400 transition">Messages</Link>
          <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-[#0f766e] dark:hover:text-teal-400 transition">Profil</Link>
          <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-[#0f766e] dark:hover:text-teal-400 transition">Contact</Link>
          <a href="#" className="bg-[#0f766e] dark:bg-teal-500 text-white px-8 py-3 rounded-2xl font-medium hover:bg-[#0a5c53] transition">
            Commencer
          </a>
        </div>

        <div className="flex items-center gap-5">
          {/* Bouton Mode Sombre */}
          <button 
            onClick={toggleDarkMode} 
            className="text-2xl text-gray-700 dark:text-gray-300 hover:text-[#0f766e] transition"
            aria-label="Changer le thème"
          >
            {darkMode ? <Sun size={26} /> : <Moon size={26} />}
          </button>

          {/* Hamburger Mobile */}
          <button 
            className="md:hidden text-3xl text-[#0f766e] dark:text-teal-400"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-8 px-6 space-y-8 text-center text-lg">
          <Link href="/" className="block text-gray-700 dark:text-gray-300 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Accueil</Link>
          <Link href="/messages" className="block text-gray-700 dark:text-gray-300 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Messages</Link>
          <Link href="/profile" className="block text-gray-700 dark:text-gray-300 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Profil</Link>
          <Link href="/contact" className="block text-gray-700 dark:text-gray-300 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Contact</Link>
          <a href="#" className="block bg-[#0f766e] text-white py-4 rounded-2xl font-medium" onClick={() => setIsOpen(false)}>
            Commencer gratuitement
          </a>
        </div>
      )}
    </nav>
  );
}