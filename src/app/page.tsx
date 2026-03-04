// src/app/page.tsx
"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HERO avec animation */}
      <section className="pt-32 pb-20 text-center px-6 max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-bold text-[#0f766e] mb-6"
        >
          Milele4Ever.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl text-gray-700 max-w-3xl mx-auto mb-12"
        >
          La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
        </motion.p>
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          <motion.a 
            href="#" 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
          >
            Commencer gratuitement
          </motion.a>
          <motion.a 
            href="#" 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition"
          >
            Découvrir la démo
          </motion.a>
        </div>
      </section>

      {/* STATS avec stagger */}
      <section className="py-16 border-t border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center px-6">
          {[ 
            { number: "2.8M", label: "souvenirs préservés" },
            { number: "94%", label: "de satisfaction" },
            { number: "∞", label: "durée garantie" }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-6xl font-bold text-[#0f766e]">{stat.number}</p>
              <p className="text-xl text-gray-600 mt-3">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PLATEFORME */}
      <section className="py-16 text-center px-6 bg-[#ccfbf1]">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-[#0f766e] mb-6"
        >
          La plateforme faite pour l’éternité
        </motion.h2>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Sécurité • Agents intelligents • Sauvegarde automatique • Confidentialité absolue
        </p>
      </section>

      {/* USAGES avec hover */}
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="border-b border-gray-200 pb-8 last:border-0 hover:shadow-lg rounded-3xl p-6 transition"
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