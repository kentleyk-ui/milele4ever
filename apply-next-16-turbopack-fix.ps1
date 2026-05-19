# Patch for Next.js 16.2.4 Turbopack distDirRoot bug on Windows
# This fixes: "Cannot read properties of undefined (reading 'replace')" in normalizePathOnWindows
# and "Invalid distDirRoot: ''. distDirRoot should not navigate out of the projectPath."


if (-not (Test-Path $swcIndexPath)) {
    Write-Host "⚠ next/dist/build/swc/index.js not found at $swcIndexPath"
    exit 1
}

# Patch 1: Make normalizePathOnWindows null-safe

if ($content -match [regex]::Escape($old1)) {
    Write-Host "✓ Patched normalizePathOnWindows to handle null"
} else {
    Write-Host "⚠ normalizePathOnWindows already patched or pattern not found"
}

# Patch 2: Add distDirRoot fallback with _ensureRelPrefix helper

        // Ensure they start with './' so Rust's Path::starts_with(""."") works correctly

    Write-Host "✓ Added distDirRoot fallback with _ensureRelPrefix"
} else {
    Write-Host "⚠ distDirRoot fallback already patched or pattern not found"
}

Set-Content $swcIndexPath -Value $content -NoNewline
Write-Host "✓ Applied Next.js 16.2.4 Turbopack fix"
