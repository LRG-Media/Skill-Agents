# Étape 11 : Test File

Fichier de test des endpoints API au format Node.js ESM.

## Template

```js
// server/features/[domain]/[feature]/test.[feature].routes.mjs

import { getRouteTestRuntime, loginForRouteTests } from '../../../shared/utils/routeTestUtils.mjs';

const runtime = getRouteTestRuntime(import.meta.url, 'demo');
const { baseUrl: BASE_URL, portalType: PORTAL_TYPE } = runtime;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function logTest(number, method, url, status, details = '') {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${colors.cyan}#${number}${colors.reset} ${colors.dim}${method}${colors.reset} ${url} → ${color}${status}${colors.reset}${details ? ' ' + details : ''}`);
}

async function makeRequest(method, endpoint, body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return { success: false, status: 'ERROR', error: error.message };
  }
}

let createdId = null;

async function main() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  TEST: Credit Notes Routes${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const results = { pass: 0, fail: 0, error: 0, skipped: 0 };
  let testNumber = 0;

  // Auth
  const auth = await loginForRouteTests(runtime);
  if (!auth?.authToken) {
    console.log(`${colors.red}ERROR: Could not authenticate${colors.reset}`);
    process.exit(1);
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth.authToken}`,
    'x-portal-type': PORTAL_TYPE,
  };

  // Test 1: GET list
  testNumber++;
  const t1 = await makeRequest('GET', '/api/credit-notes?page=1&limit=10', null, headers);
  if (t1.success) { logTest(testNumber, 'GET', '/api/credit-notes', 'PASS'); results.pass++; }
  else { logTest(testNumber, 'GET', '/api/credit-notes', 'FAIL', `(${t1.status})`); results.fail++; }

  // Test 2: POST create
  testNumber++;
  const t2 = await makeRequest('POST', '/api/credit-notes', {
    account_id: 1,
    amount: 150.00,
    reason: 'Test credit note',
    status: 'draft',
  }, headers);
  if (t2.success && t2.data?.data?.id) {
    createdId = t2.data.data.id;
    logTest(testNumber, 'POST', '/api/credit-notes', 'PASS', `(id: ${createdId})`);
    results.pass++;
  } else { logTest(testNumber, 'POST', '/api/credit-notes', 'FAIL', `(${t2.status})`); results.fail++; }

  // Test 3: GET by id
  if (createdId) {
    testNumber++;
    const t3 = await makeRequest('GET', `/api/credit-notes/${createdId}`, null, headers);
    if (t3.success) { logTest(testNumber, 'GET', `/api/credit-notes/${createdId}`, 'PASS'); results.pass++; }
    else { logTest(testNumber, 'GET', `/api/credit-notes/${createdId}`, 'FAIL', `(${t3.status})`); results.fail++; }
  }

  // Test 4: PUT update
  if (createdId) {
    testNumber++;
    const t4 = await makeRequest('PUT', `/api/credit-notes/${createdId}`, {
      reason: 'Updated reason',
      status: 'issued',
    }, headers);
    if (t4.success) { logTest(testNumber, 'PUT', `/api/credit-notes/${createdId}`, 'PASS'); results.pass++; }
    else { logTest(testNumber, 'PUT', `/api/credit-notes/${createdId}`, 'FAIL', `(${t4.status})`); results.fail++; }
  }

  // Test 5: DELETE
  if (createdId) {
    testNumber++;
    const t5 = await makeRequest('DELETE', `/api/credit-notes/${createdId}`, null, headers);
    if (t5.success) { logTest(testNumber, 'DELETE', `/api/credit-notes/${createdId}`, 'PASS'); results.pass++; }
    else { logTest(testNumber, 'DELETE', `/api/credit-notes/${createdId}`, 'FAIL', `(${t5.status})`); results.fail++; }
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`Results: ${colors.green}${results.pass} pass${colors.reset}, ${colors.red}${results.fail} fail${colors.reset}, ${colors.red}${results.error} errors${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  process.exit(results.fail > 0 || results.error > 0 ? 1 : 0);
}

main().catch(console.error);
```

## Exécution

```bash
node server/features/finance/credit-notes/test.credit-note.routes.mjs
```

## Imports Requis

```js
import { getRouteTestRuntime, loginForRouteTests } from '../../../shared/utils/routeTestUtils.mjs';
```

## Structure de Chaque Test

1. `testNumber++`
2. `await makeRequest('METHOD', '/api/endpoint', body, headers)`
3. Vérification `t.success` → logTest PASS ou FAIL
4. Incrémentation `results.pass++` ou `results.fail++`
5. Si création : stocker `createdId` pour les tests suivants

## Hooks Disponibles

| Hook | Description |
|------|-------------|
| `getRouteTestRuntime(import.meta.url, portal)` | Initialise le runtime (URL, portal type) |
| `loginForRouteTests(runtime)` | Authentifie et retourne `{ authToken }` |
| `checkServerOnline(runtime)` | Vérifie que le serveur est accessible |
