#!/usr/bin/env node
/**
 * Upload un fichier zone vers /var/named/ sur le serveur et recharge PowerDNS
 * Usage: node .github/skills/dns-cloud-server/scripts/sync-zone-to-server.js zones/domaine.com.db
 * 
 * Pre-requis: SSH access au serveur (port 2222)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';

const CONFIG = {
    sshHost: '34.47.5.151',
    sshPort: '2222',
    sshUser: 'root',
    remoteDir: '/var/named'
};

const zoneFile = process.argv[2];

if (!zoneFile) {
    console.log('Usage: node sync-zone-to-server.js <chemin-vers-zone.db>');
    console.log('Exemple: node sync-zone-to-server.js zones/lrgmedia.ca.db');
    process.exit(1);
}

if (!existsSync(zoneFile)) {
    console.error(`\u274C Fichier non trouve: ${zoneFile}`);
    process.exit(1);
}

const fileName = basename(zoneFile);
const sshCmd = `ssh -p ${CONFIG.sshPort} ${CONFIG.sshUser}@${CONFIG.sshHost}`;

try {
    console.log(`\u{1F4E4} Upload de ${fileName} vers ${CONFIG.remoteDir}/...`);
    
    // Upload via SCP
    execSync(`scp -P ${CONFIG.sshPort} "${zoneFile}" ${CONFIG.sshUser}@${CONFIG.sshHost}:${CONFIG.remoteDir}/`, {
        stdio: 'inherit'
    });

    console.log(`\u2705 Upload termine`);
    
    // Verifier le fichier sur le serveur
    console.log(`\n\u{1F50D} Verification du fichier sur le serveur...`);
    const catOutput = execSync(`${sshCmd} "cat ${CONFIG.remoteDir}/${fileName}"`, {
        encoding: 'utf8'
    });
    console.log(`\u2705 Fichier verifie (${catOutput.split('\n').length} lignes)`);
    
    // Recharger PowerDNS
    console.log(`\n\u{1F504} Rechargement de PowerDNS...`);
    const reloadOutput = execSync(`${sshCmd} "pdns_control reload"`, {
        encoding: 'utf8'
    });
    console.log(`\u2705 ${reloadOutput.trim()}`);
    
    console.log(`\n\u2705 Zone ${fileName} deployee et rechargement effectue`);

} catch (error) {
    console.error(`\u274C Erreur: ${error.message}`);
    process.exit(1);
}
