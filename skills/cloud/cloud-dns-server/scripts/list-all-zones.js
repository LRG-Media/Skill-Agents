#!/usr/bin/env node
/**
 * Liste toutes les zones PowerDNS sur le serveur
 * Usage: node .github/skills/dns-cloud-server/scripts/list-all-zones.js
 * 
 * Verifie:
 * 1. Zones actives dans PowerDNS (pdns_control list-zones)
 * 2. Fichiers zone dans /var/named/*.db
 * 3. Comparaison des deux listes
 */

import { execSync } from 'child_process';

const CONFIG = {
    sshHost: '34.47.5.151',
    sshPort: '2222',
    sshUser: 'root',
    remoteDir: '/var/named'
};

const sshCmd = `ssh -p ${CONFIG.sshPort} ${CONFIG.sshUser}@${CONFIG.sshHost}`;

async function main() {
    console.log(`\u{1F4CB} Liste des zones DNS du serveur`);
    console.log('='.repeat(50));

    // 1. Fichiers zone sur le serveur
    console.log(`\n--- 1. Fichiers zone dans ${CONFIG.remoteDir}/ ---`);
    let fileZones = [];
    try {
        const lsOutput = execSync(`${sshCmd} "ls ${CONFIG.remoteDir}/*.db 2>/dev/null"`, {
            encoding: 'utf8'
        }).trim();
        fileZones = lsOutput.split('\n').map(f => f.replace(`${CONFIG.remoteDir}/`, '').replace('.db', ''));
        console.log(`\u2705 ${fileZones.length} zones trouvees`);
        fileZones.forEach(z => console.log(`   - ${z}`));
    } catch (e) {
        console.log(`\u274C Aucun fichier zone trouve`);
    }

    // 2. Zones PowerDNS actives
    console.log(`\n--- 2. Zones actives PowerDNS ---`);
    let pdnsZones = [];
    try {
        const listOutput = execSync(`${sshCmd} "pdns_control list-zones 2>/dev/null || pdnsutil list-zone 2>/dev/null || echo 'ERREUR'"`, {
            encoding: 'utf8'
        }).trim();
        
        if (listOutput === 'ERREUR') {
            console.log(`\u26A0\uFE0F  Impossible de lister les zones PowerDNS`);
        } else {
            pdnsZones = listOutput.split('\n').map(z => z.trim().replace(/\.$/, '')).filter(z => z.length > 0 && !z.includes('.in-addr.arpa') && !z.includes('.ip6.arpa') && z !== 'localdomain' && z !== 'localhost' && !z.startsWith('All zonecount'));
            console.log(`\u2705 ${pdnsZones.length} zones actives`);
            pdnsZones.forEach(z => console.log(`   - ${z}`));
        }
    } catch (e) {
        console.log(`\u26A0\uFE0F  Erreur lors de la lecture des zones PowerDNS`);
    }

    // 3. Comparaison
    console.log(`\n--- 3. Comparaison ---`);
    
    // Normaliser les noms de zones (enlever les points finaux)
    const normalizeZone = z => z.replace(/\.$/, '').toLowerCase();
    
    const fileSet = new Set(fileZones.map(normalizeZone));
    const pdnsSet = new Set(pdnsZones.map(normalizeZone));
    
    const onlyInFiles = fileZones.filter(z => !pdnsSet.has(normalizeZone(z)));
    const onlyInPdns = pdnsZones.filter(z => !fileSet.has(normalizeZone(z)));
    const inBoth = fileZones.filter(z => pdnsSet.has(normalizeZone(z)));

    if (inBoth.length > 0) {
        console.log(`\u2705 ${inBoth.length} zones coherentes (fichier + PowerDNS)`);
    }

    if (onlyInFiles.length > 0) {
        console.log(`\n\u26A0\uFE0F  ${onlyInFiles.length} zones avec fichier mais PAS dans PowerDNS:`);
        onlyInFiles.forEach(z => console.log(`   - ${z}`));
    }

    if (onlyInPdns.length > 0) {
        console.log(`\n\u26A0\uFE0F  ${onlyInPdns.length} zones dans PowerDNS mais PAS de fichier zone:`);
        onlyInPdns.forEach(z => console.log(`   - ${z}`));
    }

    if (onlyInFiles.length === 0 && onlyInPdns.length === 0) {
        console.log(`\u2705 Tout est coherent!`);
    }

    // 4. Resume
    console.log(`\n--- 4. Resume ---`);
    console.log(`  Fichiers zone:  ${fileZones.length}`);
    console.log(`  Zones PowerDNS: ${pdnsZones.length}`);
    console.log(`  Coherents:      ${inBoth.length}`);
    console.log(`  Decalages:      ${onlyInFiles.length + onlyInPdns.length}`);

    console.log('\n' + '='.repeat(50));
    console.log('\u2705 Termine');
}

main().catch(console.error);
