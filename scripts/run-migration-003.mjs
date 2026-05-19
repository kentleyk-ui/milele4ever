import { readFileSync } from "node:fs"

const migrationFile = process.argv[2] ?? "migration-003-feedbacks.sql"
const projectRef = process.env.SUPABASE_PROJECT_REF
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!projectRef || !accessToken) {
  console.error("Variables manquantes: SUPABASE_PROJECT_REF et SUPABASE_ACCESS_TOKEN")
  process.exit(1)
}

const sql = readFileSync(new URL(`./sql/${migrationFile}`, import.meta.url), "utf8")

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
})

const text = await response.text()
console.log("Status:", response.status)
console.log("Response:", text)

if (!response.ok) {
  console.error("\nEchec migration SQL")
  process.exit(1)
}

console.log(`\nMigration executee avec succes: ${migrationFile}`)
