import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const publicDir = path.resolve("public")
const exts = new Set([".jpg", ".jpeg", ".png"])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
      continue
    }
    if (exts.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }

  return files
}

async function convertFile(filePath) {
  const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, ".webp")
  const avifPath = filePath.replace(/\.(jpg|jpeg|png)$/i, ".avif")

  const input = sharp(filePath)
  await input.clone().webp({ quality: 82 }).toFile(webpPath)
  await input.clone().avif({ quality: 56 }).toFile(avifPath)
  return { webpPath, avifPath }
}

const files = await walk(publicDir)
if (files.length === 0) {
  console.log("Aucune image JPG/PNG a convertir dans /public")
  process.exit(0)
}

let converted = 0
let skipped = 0

for (const file of files) {
  try {
    const { webpPath, avifPath } = await convertFile(file)
    converted += 1
    console.log(`Converti: ${path.relative(publicDir, file)} -> ${path.relative(publicDir, webpPath)}, ${path.relative(publicDir, avifPath)}`)
  } catch (error) {
    skipped += 1
    console.log(`Ignore: ${path.relative(publicDir, file)} (${error.message})`)
  }
}

console.log(`Termine: ${converted} convertie(s), ${skipped} ignoree(s), ${files.length} source(s).`)
