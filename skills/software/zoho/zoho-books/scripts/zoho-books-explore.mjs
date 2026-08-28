/**
 * Script d'exploration Zoho Books
 * Récupère la structure de l'entreprise et le plan comptable
 */

const ACCESS_TOKEN = '1000.94aa5be55dd17ddc189ba25652e87652.3c6914667bf03d534c53f462e0e4f6f2';
const ORG_ID = '851244506';
const BASE_URL = 'https://www.zohoapis.com/books/v3';

const headers = {
  'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
  'Accept': 'application/json',
};

// organization_id TOUJOURS en query param, jamais dans le path
function url(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE_URL}${path}${sep}organization_id=${ORG_ID}`;
}

async function api(path) {
  const fullUrl = url(path);
  try {
    const res = await fetch(fullUrl, { headers });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { raw: text.substring(0, 500), status: res.status, url: fullUrl }; }
  } catch (err) { return { error: err.message, url: fullUrl }; }
}

async function main() {
  console.log('=== Exploration Zoho Books - LRG Media ===');
  console.log(`Org ID: ${ORG_ID} | Domain: zohoapis.ca\n`);

  // 1. Organisation
  console.log('=== 1. ORGANISATION ===');
  const org = await api('/organizations');
  if (org.code === 0 && org.organizations?.length) {
    const o = org.organizations[0];
    console.log(`Nom: ${o.name}`);
    console.log(`ID: ${o.organization_id}`);
    console.log(`Devise: ${o.currency_code}`);
    console.log(`Email: ${o.email}`);
    console.log(`Téléphone: ${o.phone}`);
  } else console.log(JSON.stringify(org, null, 2));

  // 2. Plan comptable
  console.log('\n=== 2. PLAN COMPTABLE ===');
  const coa = await api('/chartofaccounts?per_page=200');
  if (coa.code === 0 && coa.chartofaccounts) {
    console.log(`Total: ${coa.chartofaccounts.length} comptes\n`);
    const grouped = {};
    coa.chartofaccounts.forEach(a => {
      const t = a.account_type || 'Autre';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(a);
    });
    for (const [type, accs] of Object.entries(grouped)) {
      console.log(`--- ${type} (${accs.length}) ---`);
      accs.forEach(a => console.log(`  [${a.account_code || 'N/A'}] ${a.account_name} — ${a.balance || 0} $`));
      console.log('');
    }

    // Comptes paie
    console.log('=== COMPTES PAIE ===');
    const payroll = coa.chartofaccounts.filter(a => {
      const n = (a.account_name || '').toLowerCase();
      return ['salair','payroll','paie','cotisation','rrq','rqap','emploi','fss','impot','tax','withhold','retenue','benefit','employee','wages','bonus','avantage'].some(k => n.includes(k));
    });
    if (payroll.length) payroll.forEach(a => console.log(`  [${a.account_type}] ${a.account_name} (ID: ${a.account_id})`));
    else console.log('Aucun compte paie trouvé — devront être créés.');
  } else console.log(JSON.stringify(coa, null, 2));

  // 3. Factures clients
  console.log('\n=== 3. FACTURES CLIENTS ===');
  const inv = await api('/invoices?per_page=5');
  if (inv.code === 0) {
    console.log(`Total: ${inv.page_context?.total || 0}`);
    (inv.invoices || []).forEach(i => console.log(`  ${i.invoice_number} — ${i.customer_name} — ${i.total} $ — ${i.status}`));
  } else console.log(JSON.stringify(inv, null, 2).substring(0, 300));

  // 4. Factures fournisseurs
  console.log('\n=== 4. BILLS ===');
  const bills = await api('/bills?per_page=5');
  if (bills.code === 0) {
    console.log(`Total: ${bills.page_context?.total || 0}`);
    (bills.bills || []).forEach(b => console.log(`  ${b.bill_number} — ${b.vendor_name} — ${b.total} $ — ${b.status}`));
  } else console.log(JSON.stringify(bills, null, 2).substring(0, 300));

  // 5. Contacts
  console.log('\n=== 5. CONTACTS ===');
  const ct = await api('/contacts?per_page=10');
  if (ct.code === 0) {
    console.log(`Total: ${ct.page_context?.total || 0}`);
    (ct.contacts || []).forEach(c => console.log(`  ${c.contact_name} — ${c.company_name || ''} — ${c.email || ''}`));
  } else console.log(JSON.stringify(ct, null, 2).substring(0, 300));

  // 6. Journal
  console.log('\n=== 6. JOURNAL ===');
  const jrn = await api('/journalentries?per_page=5');
  if (jrn.code === 0) {
    console.log(`Total: ${jrn.page_context?.total || 0}`);
    (jrn.journalentries || []).forEach(j => console.log(`  ${j.entry_date} — ${j.notes || ''}`));
  } else console.log(JSON.stringify(jrn, null, 2).substring(0, 300));

  // 7. Rapport bilan
  console.log('\n=== 7. RAPPORTS ===');
  const today = new Date().toISOString().split('T')[0];
  const bs = await api(`/reports/balancesheet?date=${today}`);
  if (bs.code === 0) {
    console.log('Bilan OK —', JSON.stringify(bs).substring(0, 300));
  } else console.log(JSON.stringify(bs, null, 2).substring(0, 300));

  console.log('\n=== FIN ===');
}

main().catch(console.error);
