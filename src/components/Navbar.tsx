"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.theme === "dark" || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    }
    setDarkMode(!darkMode);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      {/* ... même code que précédemment ... */}
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-3xl font-bold text-[#0f766e] dark:text-teal-400">
          Milele4Ever.
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center gap-10 text-lg">
          {/* ... liens existants ... */}
        </div>

        <div className="flex items-center gap-4">
          {/* Bouton Dark Mode */}
          <button onClick={toggleDarkMode} className="text-xl text-gray-700 dark:text-gray-300">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          {/* Hamburger */}
          <button className="md:hidden text-3xl text-[#0f766e]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {/* Menu Mobile (inchangé) */}
    </nav>
  );
}