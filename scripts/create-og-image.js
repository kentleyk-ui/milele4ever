const fs = require("fs");
const path = require("path");

// Créer un simple PNG 1200x630 avec dégradé bleu/or (format PNG binary compressé)
// Ce PNG représente un fond dégradé simple avec du texte
// En attendant, on crée un SVG et on le referencia

const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#081b38;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a2e5c;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Decorative circles -->
  <circle cx="600" cy="315" r="80" fill="none" stroke="#d4a853" stroke-width="2" opacity="0.3"/>
  <circle cx="600" cy="315" r="90" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.2"/>
  
  <!-- Main title -->
  <text x="600" y="280" font-size="100" font-weight="bold" fill="#f3cb72" text-anchor="middle" font-family="Georgia, serif">Milele</text>
  
  <!-- Subtitle -->
  <text x="600" y="360" font-size="60" fill="#7dd3fc" text-anchor="middle" font-family="Georgia, serif">Pour toujours</text>
  
  <!-- Description -->
  <text x="600" y="430" font-size="32" fill="#d1d5db" text-anchor="middle" font-family="Georgia, serif">Hommages • Souvenirs • Mémoire</text>
  
  <!-- Decorative line -->
  <line x1="300" y1="480" x2="900" y2="480" stroke="#d4a853" stroke-width="2" opacity="0.4"/>
</svg>`;

const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Sauvegarder l'SVG comme fichier temporaire
const svgPath = path.join(publicDir, "og-image.svg");
fs.writeFileSync(svgPath, svg);
console.log(`✓ SVG créé: ${svgPath}`);

// Essayer de l'exporter en PNG via sharp s'il est disponible
try {
  const sharp = require("sharp");
  sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(publicDir, "og-image.png"))
    .then(() => {
      console.log(`✓ PNG créé: ${path.join(publicDir, "og-image.png")}`);
      // Convertir PNG en JPG
      return sharp(path.join(publicDir, "og-image.png"))
        .jpeg({ quality: 85, progressive: true })
        .toFile(path.join(publicDir, "og-image.jpg"));
    })
    .then(() => {
      console.log(`✓ JPG créé: ${path.join(publicDir, "og-image.jpg")} (1200x630px)`);
    })
    .catch((err) => {
      console.error("Erreur lors de la conversion:", err.message);
      console.log("Utilisation de SVG en fallback pour og:image");
    });
} catch (e) {
  console.log("sharp non disponible - SVG utilisé comme fallback");
  console.log("Pour convertir en JPG, installez: npm install sharp");
}
