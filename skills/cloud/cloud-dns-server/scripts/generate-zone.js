#!/usr/bin/env node
/**
 * Genere un fichier zone Bind a partir des DNS publics d un domaine
 * Usage: node .github/skills/dns-cloud-server/scripts/generate-zone.js domaine.com
 * Output: zones/domaine.com.db
 */

import { resolve4, resolve6, resolveMx, resolveTxt, resolveNs, resolveCname } from 'dns';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..', '..', '..', '..');

const resolve4Async = promisify(resolve4);
const resolve6Async = promisify(resolve6);
const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);
const resolveNsAsync = promisify(resolveNs);
const resolveCnameAsync = promisify(resolveCname);

const CONFIG = {
    serverIp: '34.47.5.151',
    primaryNS: 'ns1.cloud.lrgmedia.ca.',
    secondaryNS: 'ns2.cloud.lrgmedia.ca.',
    adminEmail: 'admin.cloud.lrgmedia.ca.',
    defaultTTL: 3600,
    refresh: 3600,
    retry: 600,
    expire: 604800,
    minimum: 86400
};

const domain = process.argv[2];

if (!domain) {
    console.log('Usage: node generate-zone.js <domaine>');
    console.log('Exemple: node generate-zone.js lrgmedia.ca');
    process.exit(1);
}

function generateSerial() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}01`;
}

async function queryAll(domain) {
    const records = { A: [], AAAA: [], MX: [], TXT: [], CNAME: [], NS: [] };

    try { records.A = await resolve4Async(domain); } catch (e) {}
    try { records.AAAA = await resolve6Async(domain); } catch (e) {}
    try { records.MX = await resolveMxAsync(domain); } catch (e) {}
    try { const txt = await resolveTxtAsync(domain); records.TXT = txt.map(r => r.join('')); } catch (e) {}
    try { records.CNAME = await resolveCnameAsync(domain); } catch (e) {}
    try { records.NS = await resolveNsAsync(domain); } catch (e) {}

    // Subdomains
    const subdomains = ['www', 'mail', 'ftp', 'webmail', 'webdisk', 'cpanel', 'whm', 'autoconfig', 'autodiscover', 'dev', 'api', 'client', 'cloud'];
    records.SUBDOMAINS = {};

    for (const sub of subdomains) {
        const subDomain = `${sub}.${domain}`;
        records.SUBDOMAINS[sub] = {};
        try { records.SUBDOMAINS[sub].A = await resolve4Async(subDomain); } catch (e) {}
        try { records.SUBDOMAINS[sub].CNAME = await resolveCnameAsync(subDomain); } catch (e) {}
    }

    return records;
}

function generateZoneFile(domain, records) {
    const serial = generateSerial();
    const lines = [];

    // Header
    lines.push(`$TTL ${CONFIG.defaultTTL}`);
    lines.push(`@   IN  SOA ${CONFIG.primaryNS} ${CONFIG.adminEmail} (`);
    lines.push(`            ${serial}  ; Serial`);
    lines.push(`            ${CONFIG.refresh}  ; Refresh`);
    lines.push(`            ${CONFIG.retry}  ; Retry`);
    lines.push(`            ${CONFIG.expire}  ; Expire`);
    lines.push(`            ${CONFIG.minimum}  ; Minimum TTL`);
    lines.push(`)`);
    lines.push('');

    // NS records
    lines.push(`; NS Records`);
    lines.push(`@   IN  NS  ${CONFIG.primaryNS}`);
    lines.push(`@   IN  NS  ${CONFIG.secondaryNS}`);
    lines.push('');

    // A records
    if (records.A.length > 0) {
        lines.push(`; A Records`);
        for (const ip of records.A) {
            lines.push(`@   IN  A   ${ip}`);
        }
        lines.push('');
    }

    // AAAA records
    if (records.AAAA.length > 0) {
        lines.push(`; AAAA Records`);
        for (const ip of records.AAAA) {
            lines.push(`@   IN  AAAA    ${ip}`);
        }
        lines.push('');
    }

    // MX records
    if (records.MX.length > 0) {
        lines.push(`; MX Records`);
        for (const mx of records.MX) {
            lines.push(`@   IN  MX  ${mx.priority}  ${mx.exchange}`);
        }
        lines.push('');
    }

    // TXT records
    if (records.TXT.length > 0) {
        lines.push(`; TXT Records`);
        for (const txt of records.TXT) {
            lines.push(`@   IN  TXT "${txt}"`);
        }
        lines.push('');
    }

    // Subdomain records
    for (const [sub, data] of Object.entries(records.SUBDOMAINS)) {
        if (data.A && data.A.length > 0) {
            lines.push(`; ${sub} A Records`);
            for (const ip of data.A) {
                lines.push(`${sub}   IN  A   ${ip}`);
            }
            lines.push('');
        }
        if (data.CNAME && data.CNAME.length > 0) {
            lines.push(`; ${sub} CNAME Records`);
            for (const cname of data.CNAME) {
                lines.push(`${sub}   IN  CNAME   ${cname}`);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}

async function main() {
    console.log(`\u{1F527} Generation de la zone pour: ${domain}`);
    console.log('='.repeat(50));

    const records = await queryAll(domain);
    
    // Si pas d A record, utiliser l IP du serveur
    if (records.A.length === 0 && records.CNAME.length === 0) {
        console.log(`\u26A0\uFE0F  Pas d A record detecte, utilisation de l IP serveur: ${CONFIG.serverIp}`);
        records.A = [CONFIG.serverIp];
    }

    const zoneContent = generateZoneFile(domain, records);
    
    // Creer le dossier zones/ si inexistant
    const zonesDir = join(PROJECT_ROOT, 'zones');
    if (!existsSync(zonesDir)) {
        mkdirSync(zonesDir, { recursive: true });
    }

    const zoneFile = join(zonesDir, `${domain}.db`);
    writeFileSync(zoneFile, zoneContent, 'utf8');

    console.log(`\u2705 Zone generee: ${zoneFile}`);
    console.log(`\nContenu:\n${zoneContent}`);
}

main().catch(console.error);
