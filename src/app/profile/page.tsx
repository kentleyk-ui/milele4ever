// src/app/profile/page.tsx
export default function Profile() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-[#0f766e] mb-8 text-center">
        Mon Profil
      </h1>
      <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center text-6xl">
            👤
          </div>
          <h2 className="text-3xl font-semibold text-gray-800">Kentley K.</h2>
          <p className="text-gray-600 mt-2">Membre depuis mars 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-8 rounded-2xl">
            <h3 className="font-semibold text-[#0f766e] mb-4">Mes souvenirs</h3>
            <p className="text-4xl font-bold text-[#0f766e]">47</p>
            <p className="text-sm text-gray-500">photos • vidéos • textes</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <h3 className="font-semibold text-[#0f766e] mb-4">Partagés avec</h3>
            <p className="text-4xl font-bold text-[#0f766e]">12</p>
            <p className="text-sm text-gray-500">personnes & familles</p>
          </div>
        </div>
      </div>
    </div>
  );
}