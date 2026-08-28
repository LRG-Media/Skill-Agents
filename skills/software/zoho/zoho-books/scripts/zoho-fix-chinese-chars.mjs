/**
 * Renommer les comptes avec caractères chinois → français
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
  console.log('=== Correction des comptes avec caractères chinois ===\n');

  const coa = await api('/chartofaccounts?per_page=200');
  if (coa.code !== 0) { console.log('Erreur:', coa); return; }

  const renames = [
    { code: '2720', newName: 'Cotisations员工 RRQ — à payer' },
    { code: '2725', newName: 'Cotisations员工 RQAP — à payer' },
    { code: '2730', newName: 'Cotisations员工 AE — à payer' },
    { code: '2735', newName: 'Cotisations员工 FSS — à payer' },
  ];

  for (const r of renames) {
    const account = coa.chartofaccounts.find(a => a.account_code === r.code);
    if (!account) { console.log(`❌ ${r.code} non trouvé`); continue; }

    // Supprimer "员工" du nom
    const fixedName = r.newName.replace('员工', ' employé');
    console.log(`[${r.code}] "${account.account_name}" → "${fixedName}"`);

    const result = await api(`/chartofaccounts/${account.account_id}`, 'PUT', {
      account_name: fixedName,
      account_code: r.code,
      account_type: account.account_type,
      description: account.description || '',
    });

    console.log(result.code === 0 ? '  ✅ OK' : `  ❌ ${result.message}`);
  }

  // Vérification
  console.log('\n=== VÉRIFICATION ===');
  const verify = await api('/chartofaccounts?per_page=200');
  if (verify.code === 0) {
    const accounts = verify.chartofaccounts
      .filter(a => ['2710','2715','2720','2725','2730','2735','2740','2745','6161','6162','6163','6164','6165','6166'].includes(a.account_code))
      .sort((a, b) => a.account_code.localeCompare(b.account_code));
    accounts.forEach(a => console.log(`  [${a.account_code}] ${a.account_name}`));
  }
}

main().catch(console.error);
