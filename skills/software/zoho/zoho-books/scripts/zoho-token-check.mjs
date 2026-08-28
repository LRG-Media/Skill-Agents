/**
 * Vérification du token Zoho et de ses scopes
 */

const ACCESS_TOKEN = '1000.a8ed2a135254cfb01638828941508e02.71d5d97653756dbf6881851526b2a196';

const headers = {
  'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

async function main() {
  console.log('=== Vérification du token Zoho ===\n');

  // 1. Infos sur le token via l'API Accounts
  console.log('--- Test API Zoho Accounts (userinfo) ---');
  try {
    const res = await fetch('https://accounts.zoho.com/api/v1/user/info', { headers });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Erreur:', err.message);
  }

  // 2. Test API Zoho.com (accounts CA)
  console.log('\n--- Test API Zoho.ca Accounts ---');
  try {
    const res = await fetch('https://accounts.zoho.ca/api/v1/user/info', { headers });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Erreur:', err.message);
  }

  // 3. Essayer avec le scope books directement
  console.log('\n--- Test Books v3 /organizations avec header Accept ---');
  for (const domain of ['zohoapis.com', 'zohoapis.ca']) {
    try {
      const url = `https://${domain}/books/v3/organizations`;
      const res = await fetch(url, {
        headers: {
          ...headers,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      console.log(`\n${domain}:`);
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(`Erreur ${domain}:`, err.message);
    }
  }

  // 4. Essayer avec le domain accounts.zoho.com pour lister les orgs
  console.log('\n--- Test Zoho Organization API (accounts) ---');
  try {
    const res = await fetch('https://accounts.zoho.com/api/v1/org', { headers });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Erreur:', err.message);
  }

  // 5. Essayer avec /api/v1/oauth/token/info
  console.log('\n--- Test OAuth Token Info ---');
  try {
    const res = await fetch(`https://accounts.zoho.com/oauth/v2/token/info?access_token=${ACCESS_TOKEN}`, {
      method: 'GET',
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Erreur:', err.message);
  }
}

main().catch(console.error);
