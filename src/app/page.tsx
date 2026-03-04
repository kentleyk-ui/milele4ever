// src/app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HERO */}
      <section className="pt-32 pb-20 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold text-[#0f766e] mb-6">
          Milele4Ever.
        </h1>
        <p className="text-2xl text-gray-700 max-w-3xl mx-auto mb-12">
          La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          <a href="#" className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition">
            Commencer gratuitement
          </a>
          <a href="#" className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition">
            Découvrir la démo
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-t border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center px-6">
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">2.8M</p>
            <p className="text-xl text-gray-600 mt-3">souvenirs préservés</p>
          </div>
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">94%</p>
            <p className="text-xl text-gray-600 mt-3">de satisfaction</p>
          </div>
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">∞</p>
            <p className="text-xl text-gray-600 mt-3">durée garantie</p>
          </div>
        </div>
      </section>

      {/* PLATEFORME */}
      <section className="py-16 text-center px-6 bg-[#ccfbf1]">
        <h2 className="text-4xl font-bold text-[#0f766e] mb-6">
          La plateforme faite pour l’éternité
        </h2>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Sécurité • Agents intelligents • Sauvegarde automatique • Confidentialité absolue
        </p>
      </section>

      {/* USAGES */}
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
          ].map(([title, desc]) => (
            <div key={title} className="border-b border-gray-200 pb-8 last:border-0">
              <h3 className="text-3xl font-semibold text-[#0f766e] mb-3">{title}</h3>
              <p className="text-xl text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f766e] text-white py-16 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-2xl font-semibold mb-4">Milele4Ever.</p>
          <p className="text-lg opacity-90 mb-8">Vos souvenirs, pour toujours.</p>
          <div className="text-sm opacity-75">
            © 2026 Milele4Ever – Tous droits réservés<br />
            Fait avec ❤️ pour préserver l’essentiel
          </div>
        </div>
      </footer>
    </div>
  );
}