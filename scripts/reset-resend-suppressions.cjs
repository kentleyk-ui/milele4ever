/**
 * Reset Resend suppressions + list contacts test
 * Usage: node scripts/reset-resend-suppressions.cjs re_VOTRE_CLE_API
 *
 * Ce script:
 * 1. Lit toutes les suppressions Resend et supprime celles des emails de test
 * 2. Liste toutes les audiences et supprime les contacts de test
 */

const TEST_EMAILS = [
  'kent.ley@icloud.com',
  'kentley@hotmail.com',
  'kentleyk@gmail.com',
  'derossiv@hotmail.com',
];

const RESEND_API_KEY = process.argv[2];

if (!RESEND_API_KEY || !RESEND_API_KEY.startsWith('re_')) {
  console.error('Usage: node scripts/reset-resend-suppressions.cjs re_VOTRE_CLE_API');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${RESEND_API_KEY}`,
  'Content-Type': 'application/json',
};

async function resend(method, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

(async () => {
  // 1. Suppressions (adresses bloquées dans Resend)
  console.log('\n--- SUPPRESSIONS ---');
  const suppRes = await resend('GET', '/v1/suppressions');
  const suppressions = suppRes?.data?.data ?? [];
  console.log(`Trouvé ${suppressions.length} suppression(s)`);

  for (const s of suppressions) {
    const email = (s.email ?? '').toLowerCase();
    if (TEST_EMAILS.includes(email)) {
      const del = await resend('DELETE', `/v1/suppressions/${encodeURIComponent(s.email)}`);
      console.log(`REMOVED suppression: ${s.email} → HTTP ${del?.status ?? '?'}`);
    }
  }

  // 2. Audiences + contacts
  console.log('\n--- AUDIENCES / CONTACTS ---');
  const audRes = await resend('GET', '/v1/audiences');
  const audiences = audRes?.data?.data ?? [];
  console.log(`${audiences.length} audience(s) trouvée(s)`);

  for (const aud of audiences) {
    console.log(`\nAudience: "${aud.name}" [${aud.id}]`);

    // Lister les contacts
    const cRes = await resend('GET', `/v1/audiences/${aud.id}/contacts`);
    const contacts = cRes?.data?.data ?? [];
    console.log(`  ${contacts.length} contact(s)`);

    for (const c of contacts) {
      const email = (c.email ?? '').toLowerCase();
      if (TEST_EMAILS.includes(email)) {
        const del = await resend('DELETE', `/v1/audiences/${aud.id}/contacts/${c.id}`);
        console.log(`  REMOVED contact: ${c.email} → HTTP ${del?.status ?? '?'}`);
      }
    }
  }

  console.log('\n✓ Terminé.');
})();
