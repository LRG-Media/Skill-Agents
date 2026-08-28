#!/usr/bin/env node
/**
 * Verifie l etat d une zone DNS sur le serveur PowerDNS
 * Usage: node .github/skills/dns-cloud-server/scripts/check-zone-status.js domaine.com
 * 
 * Verifie:
 * 1. Presence du fichier zone sur le serveur
 * 2. Contenu de la zone (SOA, NS, A, MX, TXT)
 * 3. Resolution DNS publique
 * 4. Comparaison serveur vs public
 */

import { execSync } from 'child_process';
import { resolve4, resolve6, resolveMx, resolveTxt, resolveNs, resolveSoa } from 'dns';
import { promisify } from 'util';

const resolve4Async = promisify(resolve4);
const resolve6Async = promisify(resolve6);
const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);
const resolveNsAsync = promisify(resolveNs);
const resolveSoaAsync = promisify(resolveSoa);

const CONFIG = {
    sshHost: '34.47.5.151',
    sshPort: '2222',
    sshUser: 'root',
    remoteDir: '/var/named'
};

const domain = process.argv[2];

if (!domain) {
    console.log('Usage: node check-zone-status.js <domaine>');
    console.log('Exemple: node check-zone-status.js lrgmedia.ca');
    process.exit(1);
}

const sshCmd = `ssh -p ${CONFIG.sshPort} ${CONFIG.sshUser}@${CONFIG.sshHost}`;

async function queryPublicDns(domain) {
    const results = { A: [], AAAA: [], MX: [], TXT: [], NS: [], SOA: null };

    try { results.A = await resolve4Async(domain); } catch (e) {}
    try { results.AAAA = await resolve6Async(domain); } catch (e) {}
    try { results.MX = await resolveMxAsync(domain); } catch (e) {}
    try { const txt = await resolveTxtAsync(domain); results.TXT = txt.map(r => r.join('')); } catch (e) {}
    try { results.NS = await resolveNsAsync(domain); } catch (e) {}
    try { results.SOA = await resolveSoaAsync(domain); } catch (e) {}

    return results;
}

async function main() {
    console.log(`\u{1F50D} Verification de la zone: ${domain}`);
    console.log('='.repeat(50));
    
    // 1. Verifier le fichier zone sur le serveur
    console.log(`\n--- 1. Fichier zone sur le serveur ---`);
    try {
        const lsOutput = execSync(`${sshCmd} "ls -la ${CONFIG.remoteDir}/${domain}.db 2>/dev/null"`, {
            encoding: 'utf8'
        }).trim();
        console.log(`\u2705 ${lsOutput}`);
        
        // Lire le contenu
        const catOutput = execSync(`${sshCmd} "cat ${CONFIG.remoteDir}/${domain}.db"`, {
            encoding: 'utf8'
        });
        const lines = catOutput.split('\n').filter(l => l.trim() && !l.startsWith(';') && !l.startsWith('$'));
        console.log(`   ${lines.length} records de donnees`);
    } catch (e) {
        console.log(`\u274C Fichier zone non trouve sur le serveur`);
        return;
    }

    // 2. Verifier PowerDNS
    console.log(`\n--- 2. Statut PowerDNS ---`);
    try {
        const version = execSync(`${sshCmd} "pdns_server --version 2>&1 | head -1"`, {
            encoding: 'utf8'
        }).trim();
        console.log(`\u2705 ${version}`);
        
        const reload = execSync(`${sshCmd} "pdns_control reload 2>&1"`, {
            encoding: 'utf8'
        }).trim();
        console.log(`\u2705 Reload: ${reload}`);
    } catch (e) {
        console.log(`\u26A0\uFE0F  Impossible de verifier PowerDNS`);
    }

    // 3. DNS Public
    console.log(`\n--- 3. DNS Public ---`);
    const publicDns = await queryPublicDns(domain);
    
    console.log(`  A:     ${publicDns.A.length > 0 ? publicDns.A.join(', ') : '(aucun)'}`);
    console.log(`  AAAA:  ${publicDns.AAAA.length > 0 ? publicDns.AAAA.join(', ') : '(aucun)'}`);
    console.log(`  MX:    ${publicDns.MX.length > 0 ? publicDns.MX.map(m => `${m.priority} ${m.exchange}`).join(', ') : '(aucun)'}`);
    console.log(`  TXT:   ${publicDns.TXT.length > 0 ? publicDns.TXT.join(' | ') : '(aucun)'}`);
    console.log(`  NS:    ${publicDns.NS.length > 0 ? publicDns.NS.join(', ') : '(aucun)'}`);
    
    if (publicDns.SOA) {
        console.log(`  SOA:   ${publicDns.SOA.nsname} / Serial: ${publicDns.SOA.serial}`);
    } else {
        console.log(`  SOA:   (aucun)`);
    }

    // 4. Comparaison
    console.log(`\n--- 4. Verification ---`);
    
    const hasCorrectNS = publicDns.NS.some(ns => 
        ns.includes('cloud.lrgmedia.ca')
    );
    
    if (hasCorrectNS) {
        console.log(`\u2705 NS指向 cloud.lrgmedia.ca`);
    } else if (publicDns.NS.length > 0) {
        console.log(`\u26A0\uFE0F  NS ne pointe PAS vers cloud.lrgmedia.ca:`);
        publicDns.NS.forEach(ns => console.log(`   ${ns}`));
    } else {
        console.log(`\u274C Pas de NS detecte (SERVFAIL?)`);
    }

    if (publicDns.A.length > 0) {
        console.log(`\u2705 A records presents`);
    } else if (publicDns.CNAME && publicDns.CNAME.length > 0) {
        console.log(`\u2705 CNAME records presents`);
    } else {
        console.log(`\u26A0\uFE0F  Pas de A record en DNS public`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\u2705 Verification terminee');
}

main().catch(console.error);
