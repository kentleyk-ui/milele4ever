// src/app/messages/page.tsx
export default function Messages() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-[#0f766e] mb-8 text-center">
        Mes Messages
      </h1>
      <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
        <p className="text-center text-gray-500 text-lg py-12">
          Aucun message pour le moment.<br />
          Vos souvenirs partagés apparaîtront ici.
        </p>
      </div>
    </div>
  );
}