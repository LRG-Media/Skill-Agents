/**
 * Échange Grant Token → Access Token via Self Client
 */

const CLIENT_ID = '1000.ZUQQWF2O2C34XR2FFIZGUR6M7SMGID';
const CLIENT_SECRET = 'de9c6cfb7990027995a3dca0b20c9ab4665a700323';
const GRANT_TOKEN = '1000.4a7b6d080bfa5df2420c90e534541cdc.35bdfa49f1b6da2f224d294125a6a650';

const DOMAINS = [
  { name: 'CA', url: 'https://accounts.zoho.ca' },
  { name: 'COM', url: 'https://accounts.zoho.com' },
  { name: 'EU', url: 'https://accounts.zoho.eu' },
  { name: 'IN', url: 'https://accounts.zoho.in' },
  { name: 'AU', url: 'https://accounts.zoho.com.au' },
];

async function main() {
  console.log('=== Échange Grant Token → Access Token ===\n');

  for (const domain of DOMAINS) {
    console.log(`--- Tentative domaine: ${domain.name} (${domain.url}) ---`);
    try {
      const res = await fetch(`${domain.url}/oauth/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: GRANT_TOKEN,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
        }),
      });
      const data = await res.json();
      
      if (data.access_token) {
        console.log(`\n✅ SUCCÈS avec ${domain.name} !\n`);
        console.log('Access Token:', data.access_token);
        console.log('Refresh Token:', data.refresh_token);
        console.log('Token Type:', data.token_type);
        console.log('Expires In:', data.expires_in, 'secondes');
        console.log('Api Domain:', data.api_domain);
        console.log('\nRegion:', domain.name);
        return;
      } else {
        console.log(`❌ Erreur: ${JSON.stringify(data, null, 2)}\n`);
      }
    } catch (err) {
      console.log(`❌ Erreur réseau: ${err.message}\n`);
    }
  }

  console.log('❌ Aucun domaine n\'a fonctionné.');
}

main();
