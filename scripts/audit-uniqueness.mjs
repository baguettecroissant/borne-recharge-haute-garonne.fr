/**
 * Deep Content Uniqueness & SEO Audit for all programmatic pages.
 * Checks:
 * 1. Intro paragraph collisions across communes (same category)
 * 2. Use case text collisions 
 * 3. Eco text collisions
 * 4. FAQ collisions (same subset of FAQs appearing on multiple pages)
 * 5. Expert tip collisions
 * 6. Real estate insight collisions
 * 7. Population tier collisions
 * 8. Missing external links
 * 9. Missing localised data points
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const communes = JSON.parse(readFileSync(join(__dirname, '../src/data/communes.json'), 'utf8'));

// Minimal reimplementation of contentEngine functions for audit
function getVariantIndex(slug, offset, maxVariants) {
  let hash = offset * 31;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % maxVariants;
}

const CATEGORY_OFFSETS = { main: 0, copropriete: 100, wallbox: 200 };
const POOLS = {
  main: { intros: 8, useCases: 6, eco: 6, communeData: 6, expertTip: 6, realEstate: 8, popTier: 8, faq: 8 },
  copropriete: { intros: 8, useCases: 6, eco: 6, communeData: 6, expertTip: 6, realEstate: 8, popTier: 8, faq: 8 },
  wallbox: { intros: 8, useCases: 6, eco: 6, communeData: 6, expertTip: 6, realEstate: 8, popTier: 8, faq: 8 }
};

function auditCategory(category) {
  const offset = CATEGORY_OFFSETS[category];
  const poolSizes = POOLS[category];
  
  const introMap = {};
  const useCaseMap = {};
  const ecoMap = {};
  const communeDataMap = {};
  const expertTipMap = {};
  const realEstateMap = {};
  const popTierMap = {};
  const faqSignatureMap = {};
  
  // Track full content fingerprints
  const fullFingerprintMap = {};

  for (const c of communes) {
    const slug = c.slug;
    
    const introIdx = getVariantIndex(slug, offset + 10, poolSizes.intros);
    const useCaseIdx = getVariantIndex(slug, offset + 20, poolSizes.useCases);
    const ecoIdx = getVariantIndex(slug, offset + 30, poolSizes.eco);
    const communeDataIdx = getVariantIndex(slug, offset + 40, poolSizes.communeData);
    const expertTipIdx = getVariantIndex(slug, offset + 50, poolSizes.expertTip);
    const realEstateIdx = getVariantIndex(slug, offset + 60, poolSizes.realEstate);
    const popTierIdx = getVariantIndex(slug, offset + 70, poolSizes.popTier);

    // FAQ indices (same logic as contentEngine)
    const faqIndices = [];
    const usedFaq = new Set();
    let faqSeed = offset;
    while (faqIndices.length < 5 && faqIndices.length < poolSizes.faq) {
      const idx = getVariantIndex(slug, faqSeed, poolSizes.faq);
      if (!usedFaq.has(idx)) {
        usedFaq.add(idx);
        faqIndices.push(idx);
      }
      faqSeed++;
    }
    const faqSignature = faqIndices.sort().join(',');
    
    // Full content fingerprint
    const fullFingerprint = `I${introIdx}-U${useCaseIdx}-E${ecoIdx}-C${communeDataIdx}-X${expertTipIdx}-R${realEstateIdx}-P${popTierIdx}-F${faqSignature}`;

    // Track collisions
    function track(map, key) {
      if (!map[key]) map[key] = [];
      map[key].push(c.nom);
    }

    track(introMap, introIdx);
    track(useCaseMap, useCaseIdx);
    track(ecoMap, ecoIdx);
    track(communeDataMap, communeDataIdx);
    track(expertTipMap, expertTipIdx);
    track(realEstateMap, realEstateIdx);
    track(popTierMap, popTierIdx);
    track(faqSignatureMap, faqSignature);
    track(fullFingerprintMap, fullFingerprint);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  AUDIT: Category "${category}" — ${communes.length} communes`);
  console.log(`${'='.repeat(60)}`);
  
  function report(label, map, poolSize) {
    const collisions = Object.entries(map).filter(([_, v]) => v.length > 1);
    const maxCollision = Math.max(...Object.values(map).map(v => v.length));
    console.log(`\n  ${label} (pool: ${poolSize}):`);
    console.log(`    Used variants: ${Object.keys(map).length}/${poolSize}`);
    console.log(`    Collisions (>1 commune): ${collisions.length}`);
    console.log(`    Worst collision: ${maxCollision} communes share same variant`);
    if (collisions.length > 0) {
      const worst = collisions.sort((a, b) => b[1].length - a[1].length).slice(0, 3);
      for (const [key, towns] of worst) {
        console.log(`      Variant #${key}: ${towns.join(', ')}`);
      }
    }
  }

  report('Intro Paragraph', introMap, poolSizes.intros);
  report('Use Case Text', useCaseMap, poolSizes.useCases);
  report('Eco Text', ecoMap, poolSizes.eco);
  report('Commune Data', communeDataMap, poolSizes.communeData);
  report('Expert Tip', expertTipMap, poolSizes.expertTip);
  report('Real Estate', realEstateMap, poolSizes.realEstate);
  report('Population Tier', popTierMap, poolSizes.popTier);
  report('FAQ Signature', faqSignatureMap, 'unique combos');
  
  const fullCollisions = Object.entries(fullFingerprintMap).filter(([_, v]) => v.length > 1);
  console.log(`\n  ⚠️ FULL FINGERPRINT COLLISIONS (exact same combination of all pools):`);
  console.log(`    ${fullCollisions.length} groups of identical pages`);
  if (fullCollisions.length > 0) {
    for (const [fp, towns] of fullCollisions) {
      console.log(`    ${fp}: ${towns.join(', ')}`);
    }
  } else {
    console.log(`    ✅ No two pages have exactly the same content combination!`);
  }
}

// Data quality audit
console.log('\n' + '='.repeat(60));
console.log('  DATA QUALITY AUDIT');
console.log('='.repeat(60));

let missingPrix = 0, missingVE = 0, missingBornes = 0, missingIntercommunalite = 0;
let missingAltitude = 0, missingLatLon = 0, missingDistTlse = 0;
let missingLogements = 0, missingLogementsMaison = 0;

for (const c of communes) {
  if (!c.prixM2Moyen) missingPrix++;
  if (!c.vehiculesElectriques) missingVE++;
  if (!c.bornesPubliques) missingBornes++;
  if (!c.intercommunalite) missingIntercommunalite++;
  if (!c.altitude) missingAltitude++;
  if (!c.latitude || !c.longitude) missingLatLon++;
  if (!c.distanceBordeaux) missingDistTlse++;
  if (!c.logements) missingLogements++;
  if (!c.logementsMaison) missingLogementsMaison++;
}

console.log(`  Total communes: ${communes.length}`);
console.log(`  Missing prixM2Moyen: ${missingPrix}`);
console.log(`  Missing vehiculesElectriques: ${missingVE}`);
console.log(`  Missing bornesPubliques: ${missingBornes}`);
console.log(`  Missing intercommunalite: ${missingIntercommunalite}`);
console.log(`  Missing altitude: ${missingAltitude}`);
console.log(`  Missing lat/lon: ${missingLatLon}`);
console.log(`  Missing distanceBordeaux (=distance Toulouse): ${missingDistTlse}`);
console.log(`  Missing logements: ${missingLogements}`);
console.log(`  Missing logementsMaison: ${missingLogementsMaison}`);

// Check for duplicates by codePostal
const postalGroups = {};
for (const c of communes) {
  if (!postalGroups[c.codePostal]) postalGroups[c.codePostal] = [];
  postalGroups[c.codePostal].push(c.nom);
}
const sharedPostal = Object.entries(postalGroups).filter(([_, v]) => v.length > 1);
console.log(`\n  Communes sharing same codePostal: ${sharedPostal.length} groups`);
for (const [cp, towns] of sharedPostal) {
  console.log(`    ${cp}: ${towns.join(', ')}`);
}

// Content engine problem: "distanceBordeaux" named wrong
console.log(`\n  ⚠️ Field naming issue: "distanceBordeaux" is used for distance to Toulouse`);
console.log(`     This is misleading in the code. Consider renaming to "distanceToulouse".`);

// Run category audits
auditCategory('main');
auditCategory('copropriete');
auditCategory('wallbox');

console.log('\n' + '='.repeat(60));
console.log('  EXTERNAL LINKS AUDIT');
console.log('='.repeat(60));
console.log('  Current external links per category:');
console.log('    main: advenir.mobi, qualifelec.fr, ALEC/Soleval, service-public.fr');
console.log('    copropriete: + legifrance.gouv.fr (droit à la prise)');
console.log('    wallbox: + automobile-propre.com');
console.log('');
console.log('  ⚠️ MISSING HIGH-AUTHORITY EXTERNAL LINKS:');
console.log('    ❌ enedis.fr (Official grid operator - essential for IRVE context)');
console.log('    ❌ ecologie.gouv.fr (Ministry official guide on EV charging)');
console.log('    ❌ data.gouv.fr/irve (Official open data on charging infrastructure)');
console.log('    ❌ france-renov.gouv.fr (Official renovation energy portal)');
console.log('    ❌ anil.org (Agence Nationale pour l\'Information sur le Logement)');
console.log('    ❌ je-roule-en-electrique.fr (Government campaign site)');
console.log('    ❌ toulouse-metropole.fr/zfe (ZFE official page)');

console.log('\n' + '='.repeat(60));
console.log('  RECOMMENDATIONS');
console.log('='.repeat(60));
console.log('  1. Increase pool sizes to 12-16 variants per dimension');
console.log('  2. Add local data-driven sections (intercommunalite-specific text)');
console.log('  3. Add more high-authority external links (gov, enedis, etc.)');
console.log('  4. Add unique population-based conditional content');
console.log('  5. Add altitude/geography-based unique content');
console.log('  6. Rename distanceBordeaux → distanceToulouse');
console.log('  7. Add sourcesCitation with varied, commune-specific sources');
console.log('  8. Add canonical URLs to prevent cross-page duplication signals');
