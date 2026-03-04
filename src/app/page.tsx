// src/app/page.tsx
"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HERO avec parallax léger */}
      <section className="pt-32 pb-20 text-center px-6 max-w-5xl mx-auto overflow-hidden">
        <motion.h1 
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-6xl md:text-7xl font-bold text-[#0f766e] mb-6"
        >
          Milele4Ever.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-2xl text-gray-700 max-w-3xl mx-auto mb-12"
        >
          La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
        </motion.p>
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          <motion.a 
            href="#" 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
          >
            Commencer gratuitement
          </motion.a>
          <motion.a 
            href="#" 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
          >
            Découvrir la démo
          </motion.a>
        </div>
      </section>

      {/* STATS avec stagger avancé */}
      <section className="py-16 border-t border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center px-6">
          {[
            { number: "2.8M", label: "souvenirs préservés" },
            { number: "94%", label: "de satisfaction" },
            { number: "∞", label: "durée garantie" }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08 }}
              className="transition"
            >
              <p className="text-6xl font-bold text-[#0f766e]">{stat.number}</p>
              <p className="text-xl text-gray-600 mt-3">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* USAGES avec hover 3D-like */}
      <section className="py-16 px-6 bg-white">
        <h2 className="text-4xl font-bold text-center text-[#0f766e] mb-12">
          Pour tous vos souvenirs
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            ["Famille", "Histoires générationnelles"],
            ["Mariages & Événements", "Moments inoubliables"],
            ["Voyages", "Aventures éternelles"],
            ["Patrimoine culturel", "Héritage vivant"]
          ].map(([title, desc], index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="border-b border-gray-200 pb-8 last:border-0 hover:shadow-2xl p-6 rounded-3xl transition"
            >
              <h3 className="text-3xl font-semibold text-[#0f766e] mb-3">{title}</h3>
              <p className="text-xl text-gray-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}