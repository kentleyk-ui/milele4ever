// src/app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HERO */}
      <section className="pt-32 pb-24 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold text-[#0f766e] mb-8 tracking-tight">
          Milele4Ever.
        </h1>
        <p className="text-2xl md:text-3xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-10 mt-12">
          <a href="#" className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition">
            Commencer gratuitement
          </a>
          <a href="#" className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-700 transition">
            Découvrir la démo
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 text-center px-6">
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">2.8M</p>
            <p className="text-xl text-gray-600 mt-4">souvenirs préservés</p>
          </div>
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">94%</p>
            <p className="text-xl text-gray-600 mt-4">de satisfaction</p>
          </div>
          <div>
            <p className="text-6xl font-bold text-[#0f766e]">∞</p>
            <p className="text-xl text-gray-600 mt-4">durée garantie</p>
          </div>
        </div>
      </section>

      {/* PLATEFORME */}
      <section className="py-20 bg-[#ccfbf1] text-center px-6">
        <h2 className="text-4xl font-bold text-[#0f766e] mb-6">
          La plateforme faite pour l’éternité
        </h2>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Sécurité • Agents intelligents • Sauvegarde automatique • Confidentialité absolue
        </p>
      </section>

      {/* USAGES */}
      <section className="py-20 px-6 bg-white">
        <h2 className="text-4xl font-bold text-center text-[#0f766e] mb-12">
          Pour tous vos souvenirs
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {[
            ["Famille", "Histoires générationnelles"],
            ["Mariages & Événements", "Moments inoubliables"],
            ["Voyages", "Aventures éternelles"],
            ["Patrimoine culturel", "Héritage vivant"]
          ].map(([title, desc]) => (
            <div key={title} className="p-8 border border-gray-100 rounded-3xl hover:border-[#0f766e] transition">
              <h3 className="text-3xl font-semibold text-[#0f766e] mb-4">{title}</h3>
              <p className="text-xl text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f766e] text-white py-16 text-center">
        <p className="text-2xl font-semibold mb-2">Milele4Ever.</p>
        <p className="text-lg opacity-90">Vos souvenirs, pour toujours.</p>
      </footer>
    </div>
  );
}