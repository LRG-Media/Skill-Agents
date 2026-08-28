/**
 * Création du module personnalisé Paie dans Zoho Books
 */
const ACCESS_TOKEN = '1000.a41d97a1ea489e0567174c2c1e7db5ad.ecde9d4cbb46406238225a715466c103';
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

async function main() {
    console.log('=== Création du module personnalisé Paie ===\n');

    // 1. Créer le module (ou récupérer l'existant)
    console.log('--- Étape 1 : Module Paie ---');
    const moduleResult = await api('/settings/modules', 'POST', {
        module_name: "Paie",
        plural_name: "Paies",
        record_name: "Numero de paie",
        description: "Module de gestion de la paie bimensuelle - LRG Media",
        shared_type: "private",
        can_edit_module: true,
        can_create_module: true,
        can_delete_module: true,
        can_attach_documents: true,
        can_show_pdf_view: false,
        can_allow_pdf_print: false,
        can_bulk_update_module: true,
        can_send_mail: false,
        can_bulk_send_mail: false,
        allow_forclone: false,
        can_lock_record: false,
        can_use_widget_for_custommodule: false,
        can_show_custommodule_lhs: true,
        show_custommodule_in: [
            { "show_in": "webui" }
        ],
        allowed_apps: ["books"]
    });

    let module_api_name = "cm_paie";
    let module_id = "5097330000009492008";

    if (moduleResult.code === 0) {
        module_api_name = moduleResult.module.api_name || moduleResult.module.module_api_name;
        module_id = moduleResult.module.module_id;
        console.log(`✅ Module créé : ${moduleResult.module.module_name} (${module_api_name})`);
        console.log(`   Module ID: ${module_id}`);
    } else if (moduleResult.code === 14800) {
        console.log(`⚠️ Module existe déjà — récupération des infos...`);
        // Récupérer le module existant
        const listResult = await api('/settings/modules');
        if (listResult.code === 0) {
            const existingModule = listResult.modules.find(m => m.module_name === "Paie");
            if (existingModule) {
                module_api_name = existingModule.api_name || existingModule.module_api_name;
                module_id = existingModule.module_id;
                console.log(`✅ Module trouvé : ${existingModule.module_name} (${module_api_name})`);
                console.log(`   Module ID: ${module_id}`);
            }
        }
    } else {
        console.log(JSON.stringify(moduleResult, null, 2));
        return;
    }

    // 2. Créer les champs personnalisés
    console.log('\n--- Étape 2 : Création des champs personnalisés ---');

    const customFields = [
        // Identifiants
        { label: "Numero de paie", type: "string", mandatory: true, description: "Ex: PAIE-2026-001" },
        { label: "Date de paie", type: "date", mandatory: true, description: "Date du versement" },
        { label: "Periode debut", type: "date", mandatory: true, description: "Debut de la periode couverte" },
        { label: "Periode fin", type: "date", mandatory: true, description: "Fin de la periode couverte" },
        { label: "Jours travailles", type: "number", mandatory: true, description: "Nombre de jours (14 regulier)" },
        // Employe
        { label: "Nom employe", type: "string", mandatory: true, description: "Nom complet de l'employe" },
        { label: "Matricule", type: "string", mandatory: false, description: "Numero d'identification" },
        // Salaire
        { label: "Salaire brut", type: "amount", mandatory: true, description: "Montant brut de la periode" },
        { label: "Salaire annuel", type: "amount", mandatory: false, description: "Revenu annuel projete" },
        // Retenues employe
        { label: "RRQ employe", type: "amount", mandatory: true, description: "Cotisation RRQ part employe" },
        { label: "RQAP employe", type: "amount", mandatory: true, description: "Cotisation RQAP part employe" },
        { label: "AE employe", type: "amount", mandatory: true, description: "Cotisation AE part employe" },
        { label: "DAS federal", type: "amount", mandatory: true, description: "Impot federal retenu" },
        { label: "DAS provincial", type: "amount", mandatory: true, description: "Impot provincial retenu" },
        { label: "Total retenues", type: "amount", mandatory: false, description: "Total des retenues" },
        // Charges patronales
        { label: "RRQ employeur", type: "amount", mandatory: true, description: "Cotisation patronale RRQ" },
        { label: "RQAP employeur", type: "amount", mandatory: true, description: "Cotisation patronale RQAP" },
        { label: "AE employeur", type: "amount", mandatory: true, description: "Cotisation patronale AE" },
        { label: "FSS employeur", type: "amount", mandatory: true, description: "Fonds des services de sante" },
        { label: "CNESST", type: "amount", mandatory: true, description: "Cotisation CNESST" },
        { label: "CNT", type: "amount", mandatory: true, description: "Normes du travail" },
        { label: "Total charges", type: "amount", mandatory: false, description: "Total charges patronales" },
        // Paiement
        { label: "Net a payer", type: "amount", mandatory: true, description: "Montant net verse" },
        { label: "Date virement", type: "date", mandatory: false, description: "Date du virement bancaire" },
        // Liens
        { label: "Journal entry ID", type: "string", mandatory: false, description: "ID ecriture de journal Zoho Books" },
        { label: "Statut", type: "dropdown", mandatory: true, options: ["Brouillon", "Valide", "Paye"], description: "Statut de la paie" },
        { label: "Notes", type: "multiline", mandatory: false, description: "Commentaires" },
    ];

    let fieldsCreated = 0;
    for (const field of customFields) {
        const apiName = "cf_" + field.label.toLowerCase().replace(/ /g, "_").replace(/é/g, "e").replace(/è/g, "e").replace(/à/g, "a");
        const fieldData = {
            label: field.label,
            api_name: apiName,
            data_type: field.type,
            entity: "cm_paie",
            show_on_pdf: false,
            is_mandatory: field.mandatory,
        };

        if (field.type === "dropdown" && field.options) {
            fieldData.values = field.options.map((o, i) => ({ name: o, order: i + 1, is_active: true }));
        }

        if (field.type === "amount") {
            fieldData.is_basecurrency_amount = true;
        }

        console.log(`  Création: ${field.label} (${field.type}) → ${apiName}`);
        const url = `/settings/fields?entity=cm_paie`;
        const result = await api(url, 'POST', fieldData);

        if (result.code === 0) {
            console.log(`    ✅ OK`);
            fieldsCreated++;
        } else {
            console.log(`    ❌ ${result.code}: ${result.message || JSON.stringify(result).substring(0, 200)}`);
        }
    }

    console.log(`\n✅ ${fieldsCreated}/${customFields.length} champs créés`);

    // 3. Vérification
    console.log('\n--- Étape 3 : Vérification ---');
    const verify = await api(`/settings/modules/${module_id}`);
    if (verify.code === 0) {
        console.log(`Module: ${verify.module.module_name}`);
        console.log(`API Name: ${verify.module.module_api_name}`);
        console.log(`ID: ${verify.module.module_id}`);
    } else {
        console.log(JSON.stringify(verify, null, 2));
    }

    console.log('\n=== FIN ===');
}

main().catch(console.error);
