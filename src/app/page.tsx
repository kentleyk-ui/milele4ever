// src/app/page.tsx
"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HERO */}
      <section className="pt-32 pb-24 text-center px-6 max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl md:text-7xl font-bold text-[#0f766e] mb-8"
        >
          Milele4Ever.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-2xl text-gray-700 max-w-3xl mx-auto"
        >
          La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
        </motion.p>
      </section>

      {/* STATS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center px-6">
          {[
            { number: "2.8M", label: "souvenirs préservés" },
            { number: "94%", label: "de satisfaction" },
            { number: "∞", label: "durée garantie" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <p className="text-6xl font-bold text-[#0f766e]">{item.number}</p>
              <p className="text-xl text-gray-600 mt-3">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* USAGES */}
      <section className="py-20 px-6 bg-white">
        <h2 className="text-4xl font-bold text-center text-[#0f766e] mb-12">
          Pour tous vos souvenirs
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            ["Famille", "Histoires générationnelles"],
            ["Mariages & Événements", "Moments inoubliables"],
            ["Voyages", "Aventures éternelles"],
            ["Patrimoine culturel", "Héritage vivant"]
          ].map(([title, desc], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="p-8 border border-gray-100 rounded-3xl hover:border-[#0f766e] transition"
            >
              <h3 className="text-3xl font-semibold text-[#0f766e] mb-3">{title}</h3>
              <p className="text-xl text-gray-600">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f766e] text-white py-16 text-center">
        <p className="text-2xl font-semibold">Milele4Ever.</p>
        <p className="text-lg opacity-90 mt-2">Vos souvenirs, pour toujours.</p>
      </footer>
    </div>
  );
}