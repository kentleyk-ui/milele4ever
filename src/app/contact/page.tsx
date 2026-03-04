// src/app/contact/page.tsx
"use client";

import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (formData: FormData) => {
    setStatus("sending");

    // Simulation d'envoi (tu pourras remplacer par Resend ou EmailJS plus tard)
    await new Promise(resolve => setTimeout(resolve, 1200));

    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    console.log("Message reçu :", { name, email, message });

    setStatus("success");
    (document.getElementById("contact-form") as HTMLFormElement).reset();

    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold text-[#0f766e] mb-8 text-center">
        Contactez-nous
      </h1>
      <p className="text-xl text-gray-700 text-center mb-12">
        Nous sommes là pour vous aider à préserver vos souvenirs éternels.
      </p>

      <form id="contact-form" action={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom</label>
          <input 
            type="text" 
            name="name" 
            required
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#0f766e]"
            placeholder="Jean Dupont" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre email</label>
          <input 
            type="email" 
            name="email" 
            required
            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[#0f766e]"
            placeholder="jean@example.com" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre message</label>
          <textarea 
            name="message" 
            rows={6} 
            required
            className="w-full px-5 py-4 border border-gray-300 rounded-3xl focus:outline-none focus:border-[#0f766e]"
            placeholder="Décrivez-nous votre projet ou votre question..."
          ></textarea>
        </div>

        <button 
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-[#0f766e] hover:bg-[#0a5c53] disabled:bg-gray-400 text-white py-5 rounded-2xl font-semibold text-lg transition"
        >
          {status === "sending" ? "Envoi en cours..." : "Envoyer le message"}
        </button>

        {status === "success" && (
          <p className="text-center text-green-600 font-medium">✅ Message envoyé avec succès ! Nous vous répondrons rapidement.</p>
        )}
        {status === "error" && (
          <p className="text-center text-red-600 font-medium">❌ Une erreur est survenue. Veuillez réessayer.</p>
        )}
      </form>
    </div>
  );
}