#!/usr/bin/env node
/**
 * Script local pour recuperer TOUS les DNS records publics d un domaine
 * Usage: node .github/skills/dns-cloud-server/scripts/dig-dns.js domain.com
 * Utilise le DNS public (8.8.8.8) - pas de SSH necessaire
 */

import { resolve4, resolve6, resolveMx, resolveTxt, resolveSrv, resolveNs, resolveSoa, resolveCname } from 'dns';
import { promisify } from 'util';

const resolve4Async = promisify(resolve4);
const resolve6Async = promisify(resolve6);
const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);
const resolveSrvAsync = promisify(resolveSrv);
const resolveNsAsync = promisify(resolveNs);
const resolveSoaAsync = promisify(resolveSoa);
const resolveCnameAsync = promisify(resolveCname);

const domain = process.argv[2];

if (!domain) {
    console.log('Usage: node dig-dns.js <domaine>');
    console.log('Exemple: node dig-dns.js lrgmedia.ca');
    process.exit(1);
}

console.log(`\u{1F50D} Recuperation des DNS records pour: ${domain}`);
console.log('='.repeat(50));
console.log('');

const results = {};

async function queryAll() {
    // A records
    try {
        results.A = await resolve4Async(domain);
    } catch (e) {
        results.A = [];
    }

    // AAAA records
    try {
        results.AAAA = await resolve6Async(domain);
    } catch (e) {
        results.AAAA = [];
    }

    // MX records
    try {
        results.MX = await resolveMxAsync(domain);
    } catch (e) {
        results.MX = [];
    }

    // TXT records
    try {
        const txt = await resolveTxtAsync(domain);
        results.TXT = txt.map(r => r.join(''));
    } catch (e) {
        results.TXT = [];
    }

    // CNAME records
    try {
        const cname = await resolveCnameAsync(domain);
        results.CNAME = cname;
    } catch (e) {
        results.CNAME = [];
    }

    // NS records
    try {
        results.NS = await resolveNsAsync(domain);
    } catch (e) {
        results.NS = [];
    }

    // SOA record
    try {
        results.SOA = await resolveSoaAsync(domain);
    } catch (e) {
        results.SOA = null;
    }

    // Sous-domaines courants
    const commonSubdomains = ['www', 'mail', 'ftp', 'webmail', 'webdisk', 'cpanel', 'whm', 'cpcalendars', 'cpcontacts', 'autoconfig', 'autodiscover', 'dev', 'api', 'client', 'cloud'];
    
    results.SUBDOMAINS = {};
    for (const sub of commonSubdomains) {
        const subDomain = `${sub}.${domain}`;
        results.SUBDOMAINS[sub] = {};
        
        try {
            const a = await resolve4Async(subDomain);
            results.SUBDOMAINS[sub].A = a;
        } catch (e) {}
        
        try {
            const aaaa = await resolve6Async(subDomain);
            results.SUBDOMAINS[sub].AAAA = aaaa;
        } catch (e) {}
        
        try {
            const cname = await resolveCnameAsync(subDomain);
            results.SUBDOMAINS[sub].CNAME = cname;
        } catch (e) {}
    }

    // Afficher les resultats
    for (const [type, records] of Object.entries(results)) {
        if (type === 'SUBDOMAINS') continue;
        
        console.log(`--- ${type} ---`);
        if (type === 'SOA') {
            if (records) {
                console.log(`  Primary NS: ${records.nsname}`);
                console.log(`  Admin: ${records.hostmaster}`);
                console.log(`  Serial: ${records.serial}`);
            } else {
                console.log('  (aucun record)');
            }
        } else if (records && records.length > 0) {
            records.forEach(r => {
                if (type === 'MX') {
                    console.log(`  ${r.priority}\t${r.exchange}`);
                } else if (type === 'SRV') {
                    console.log(`  ${r.priority} ${r.weight} ${r.port} ${r.name}`);
                } else {
                    console.log(`  ${r}`);
                }
            });
        } else {
            console.log('  (aucun record)');
        }
        console.log('');
    }

    // Afficher les sous-domaines
    if (results.SUBDOMAINS && Object.keys(results.SUBDOMAINS).length > 0) {
        console.log('--- SOUS-DOMAINES ---');
        for (const [sub, data] of Object.entries(results.SUBDOMAINS)) {
            const parts = [];
            if (data.A) parts.push(`A: ${data.A.join(', ')}`);
            if (data.AAAA) parts.push(`AAAA: ${data.AAAA.join(', ')}`);
            if (data.CNAME) parts.push(`CNAME: ${data.CNAME.join(', ')}`);
            
            if (parts.length > 0) {
                console.log(`  ${sub}: ${parts.join(' | ')}`);
            }
        }
        console.log('');
    }

    console.log('='.repeat(50));
    console.log('\u2705 Termine');
    
    return results;
}

queryAll().catch(console.error);
