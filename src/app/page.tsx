// src/app/page.tsx
"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-hidden relative">

      {/* Hero avec constellation de souvenirs flottants */}
      <section className="relative pt-32 pb-28 text-center px-6 min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-[#0f766e]/5 via-white to-white overflow-hidden">
        
        {/* Orbes flottants (la touche spéciale) */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-[#0f766e]/20 rounded-full blur-xl"
            initial={{
              x: Math.random() * 1200 - 200,
              y: Math.random() * 600 + 100,
              opacity: 0.3,
            }}
            animate={{
              x: [null, Math.random() * 1400 - 300],
              y: [null, Math.random() * 500 + 50],
              opacity: [0.2, 0.6, 0.3],
            }}
            transition={{
              duration: 25 + i * 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-7xl font-bold text-[#0f766e] tracking-tighter mb-8"
          >
            Milele4Ever.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-2xl md:text-3xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
          >
            La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
          </motion.p>

          <div className="flex flex-col sm:flex-row justify-center gap-10 mt-14">
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.05 }}
              className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
            >
              Commencer gratuitement
            </motion.a>
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.05 }}
              className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
            >
              Découvrir la démo
            </motion.a>
          </div>
        </div>
      </section>

      {/* Le reste de la page reste identique (stats, plateforme, usages, footer) */}
      {/* ... (je garde le code précédent pour ne pas surcharger) */}

    </div>
  );
}