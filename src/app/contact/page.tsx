// src/app/contact/page.tsx
export default function Contact() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold text-[#0f766e] mb-8 text-center">
        Contactez-nous
      </h1>
      <p className="text-xl text-gray-700 text-center mb-12">
        Nous sommes là pour vous aider à préserver vos souvenirs éternels.
      </p>

      <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
        <form className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom</label>
            <input type="text" className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#0f766e]" placeholder="Jean Dupont" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre email</label>
            <input type="email" className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#0f766e]" placeholder="jean@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre message</label>
            <textarea rows={6} className="w-full px-5 py-4 border border-gray-300 rounded-3xl focus:outline-none focus:border-[#0f766e]" placeholder="Décrivez-nous votre projet..."></textarea>
          </div>

          <button type="submit" className="w-full bg-[#0f766e] hover:bg-[#0a5c53] text-white py-5 rounded-2xl font-semibold text-lg transition">
            Envoyer le message
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-12">
        Nous vous répondrons dans les 48 heures.
      </p>
    </div>
  );
}