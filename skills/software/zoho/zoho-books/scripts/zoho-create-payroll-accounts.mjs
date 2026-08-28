/**
 * Création des comptes paie dans Zoho Books
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

// Comptes passifs — Retenues à la source (part employé)
const liabilityAccounts = [
  { code: '2710', name: 'DAS fédéral à payer (retenue employé)', type: 'other_current_liability', desc: 'Retenue à la source fédérale sur les salaires des employés' },
  { code: '2715', name: 'DAS provincial à payer (retenue employé)', type: 'other_current_liability', desc: 'Retenue à la source provinciale (RQ) sur les salaires des employés' },
  { code: '2720', name: 'Cotisations员工 RRQ — à payer', type: 'other_current_liability', desc: 'Cotisations au Régime de rentes du Québec — part employé, à payer à Revenu Québec' },
  { code: '2725', name: 'Cotisations员工 RQAP — à payer', type: 'other_current_liability', desc: 'Cotisations au Régime québécois d\'assurance parentale — part employé, à payer à Revenu Québec' },
  { code: '2730', name: 'Cotisations员工 AE — à payer', type: 'other_current_liability', desc: 'Cotisations à l\'Assurance-emploi — part employé, à payer à l\'ARC' },
  { code: '2735', name: 'Cotisations员工 FSS — à payer', type: 'other_current_liability', desc: 'Cotisations à la Fonds des services de santé — part employé, à payer à Revenu Québec' },
  { code: '2740', name: 'Cotisations patronales CNESST — à payer', type: 'other_current_liability', desc: 'Cotisations à la CNESST (Commission des normes, de l\'équité, de la santé et de la sécurité du travail)' },
  { code: '2745', name: 'Cotisations patronales CNT — à payer', type: 'other_current_liability', desc: 'Cotisations aux Normes du travail — part patronale, à payer à Revenu Québec' },
];

// Comptes dépenses — Cotisations patronales
const expenseAccounts = [
  { code: '6161', name: 'Cotisations patronales — RRQ', type: 'expense', desc: 'Cotisations au Régime de rentes du Québec — part patronale (6,40%)' },
  { code: '6162', name: 'Cotisations patronales — RQAP', type: 'expense', desc: 'Cotisations au Régime québécois d\'assurance parentale — part patronale (0,494%)' },
  { code: '6163', name: 'Cotisations patronales — AE', type: 'expense', desc: 'Cotisations à l\'Assurance-emploi — part patronale (1,40%)' },
  { code: '6164', name: 'Cotisations patronales — FSS', type: 'expense', desc: 'Cotisations à la Fonds des services de santé — part patronale (1,50%)' },
  { code: '6165', name: 'Cotisations patronales — CNESST', type: 'expense', desc: 'Cotisations à la CNESST — part patronale (variable selon industrie)' },
  { code: '6166', name: 'Cotisations patronales — CNT', type: 'expense', desc: 'Cotisations aux Normes du travail — part patronale (0,052%)' },
];

async function main() {
  console.log('=== Création des comptes paie dans Zoho Books ===\n');

  // Créer les comptes passifs
  console.log('--- COMPTES PASSIFS (retenues & cotisations à payer) ---');
  for (const acc of liabilityAccounts) {
    console.log(`\nCréation: [${acc.code}] ${acc.name}`);
    const result = await api('/chartofaccounts', 'POST', {
      account_name: acc.name,
      account_code: acc.code,
      account_type: acc.type,
      description: acc.desc,
      currency_id: '5097330000000000101', // CAD
    });
    if (result.code === 0) {
      console.log(`  ✅ Créé (ID: ${result.chart_of_account?.account_id})`);
    } else {
      console.log(`  ❌ Erreur: ${result.message || JSON.stringify(result)}`);
    }
  }

  // Créer les comptes dépenses
  console.log('\n\n--- COMPTES DÉPENSES (cotisations patronales) ---');
  for (const acc of expenseAccounts) {
    console.log(`\nCréation: [${acc.code}] ${acc.name}`);
    const result = await api('/chartofaccounts', 'POST', {
      account_name: acc.name,
      account_code: acc.code,
      account_type: acc.type,
      description: acc.desc,
      currency_id: '5097330000000000101', // CAD
    });
    if (result.code === 0) {
      console.log(`  ✅ Créé (ID: ${result.chart_of_account?.account_id})`);
    } else {
      console.log(`  ❌ Erreur: ${result.message || JSON.stringify(result)}`);
    }
  }

  // Vérification finale
  console.log('\n\n=== VÉRIFICATION ===');
  const coa = await api('/chartofaccounts?per_page=200');
  if (coa.code === 0) {
    const newAccounts = coa.chartofaccounts.filter(a =>
      ['2710','2715','2720','2725','2730','2735','2740','2745','6161','6162','6163','6164','6165','6166'].includes(a.account_code)
    );
    console.log(`${newAccounts.length} comptes paie créés:\n`);
    newAccounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
    newAccounts.forEach(a => {
      console.log(`  [${a.account_code}] ${a.account_name} — ${a.account_type}`);
    });
  }
}

main().catch(console.error);
