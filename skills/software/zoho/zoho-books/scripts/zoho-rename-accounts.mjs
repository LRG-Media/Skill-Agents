/**
 * Renommer les comptes existants dans Zoho Books
 */
const ACCESS_TOKEN = '1000.dd772ebe72b4627180fafde2041df37e.c10b369644f6c8e0f35abb056c58cabf';
const ORG_ID = '851244506';
const BASE_URL = 'https://www.zohoapis.com/books/v3';

const headers = {
  'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

async function api(path, method = 'GET', body = null) {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}organization_id=${ORG_ID}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

async function main() {
  // 1. Récupérer le plan comptable pour trouver les IDs
  console.log('--- Récupération des comptes ---');
  const coa = await api('/chartofaccounts?per_page=200');
  if (coa.code !== 0) { console.log('Erreur:', coa); return; }

  const targets = [
    { code: '2600', newName: 'Impôt fédéral sur le revenu (société)' },
    { code: '2605', newName: 'Impôt provincial sur le revenu (société)' },
    { code: '2550', newName: 'TPS-TVQ à payer (ventes)' },
  ];

  for (const t of targets) {
    const account = coa.chartofaccounts.find(a => a.account_code === t.code);
    if (!account) {
      console.log(`❌ Compte ${t.code} non trouvé`);
      continue;
    }

    console.log(`\n--- ${t.code}: "${account.account_name}" → "${t.newName}" ---`);
    const result = await api(`/chartofaccounts/${account.account_id}`, 'PUT', {
      account_name: t.newName,
      description: account.description || '',
      account_code: t.code,
    });

    if (result.code === 0) {
      console.log(`✅ Renommé avec succès`);
    } else {
      console.log(`❌ Erreur: ${JSON.stringify(result)}`);
    }
  }

  // 2. Vérification
  console.log('\n--- Vérification ---');
  const verify = await api('/chartofaccounts?per_page=200');
  if (verify.code === 0) {
    targets.forEach(t => {
      const acc = verify.chartofaccounts.find(a => a.account_code === t.code);
      console.log(`[${t.code}] ${acc?.account_name || 'NON TROUVÉ'}`);
    });
  }
}

main().catch(console.error);
