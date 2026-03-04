// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-[#0f766e] tracking-tight">
          Milele4Ever.
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center gap-10 text-lg">
          <Link href="/" className="text-gray-700 hover:text-[#0f766e] transition">Accueil</Link>
          <Link href="/messages" className="text-gray-700 hover:text-[#0f766e] transition">Messages</Link>
          <Link href="/profile" className="text-gray-700 hover:text-[#0f766e] transition">Profil</Link>
          <Link href="/contact" className="text-gray-700 hover:text-[#0f766e] transition">Contact</Link>
          <a href="#" className="bg-[#0f766e] text-white px-8 py-3 rounded-2xl font-medium hover:bg-[#0a5c53] transition">
            Commencer gratuitement
          </a>
        </div>

        {/* Bouton Hamburger Mobile */}
        <button 
          className="md:hidden text-3xl text-[#0f766e]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-8 px-6 space-y-8 text-center text-lg">
          <Link href="/" className="block text-gray-700 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Accueil</Link>
          <Link href="/messages" className="block text-gray-700 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Messages</Link>
          <Link href="/profile" className="block text-gray-700 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Profil</Link>
          <Link href="/contact" className="block text-gray-700 hover:text-[#0f766e]" onClick={() => setIsOpen(false)}>Contact</Link>
          <a href="#" className="block bg-[#0f766e] text-white py-4 rounded-2xl font-medium" onClick={() => setIsOpen(false)}>
            Commencer gratuitement
          </a>
        </div>
      )}
    </nav>
  );
}