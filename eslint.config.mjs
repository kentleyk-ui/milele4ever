import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "vscode-chat-customizations-evaluation/**",
      "monitoring/logs/**",
      "sauvegardes/**",
      "logs/**",
      "*.tar.gz",
      "*.zip",
      "*.log",
    ],
  },
  {
    rules: {
      // French content — apostrophes in JSX text are normal
      "react/no-unescaped-entities": "off",
      // Date.now / Math.random are used only in event handlers, not during render
      "react-hooks/purity": "off",
      // Async Supabase reads legitimately need setState inside effects
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
