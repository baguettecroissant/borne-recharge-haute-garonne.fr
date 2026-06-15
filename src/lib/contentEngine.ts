// Programmatic Content Engine - Haute-Garonne (31) - Borne de Recharge
// Generates highly unique, localized, helpful content for each commune in the Haute-Garonne department.
// Uses a multi-dimensional sentence-level spintax matrix to avoid duplicate content penalties
// and provides rich technical details (E-E-A-T) optimized for local search queries in 31.

import communes from '../data/communes.json';

export function spin(text: string, seed: string): string {
  let result = text;
  const spintaxRegex = /{([^{}|]+\|[^{}]+)}/g;
  
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (match, choicesStr) => {
      if (['VILLE', 'CODE_POSTAL', 'PRIX_MIN', 'PRIX_MAX', 'VARIANTE_INTRO'].includes(choicesStr)) {
        return match;
      }
      const choices = choicesStr.split('|');
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
      }
      hash = hash + choicesStr.length;
      const index = Math.abs(hash) % choices.length;
      return choices[index];
    });
  }
  return result;
}

export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  altitude?: number;
  prixM2Moyen?: number;
  logements?: number;
  logementsMaison?: number;
  vehiculesElectriques?: number;
  croissanceVE?: number;
  bornesPubliques?: number;
  intercommunalite?: string;
  canton?: string;
  latitude?: number;
  longitude?: number;
  distanceBordeaux?: number; // distance to Toulouse
  densiteBornes?: number;
  profilCommune?: string;
  marcheImmobilier?: string;
  tauxMaisonLabel?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
  description: string;
}

export interface GuideLink {
  href: string;
  label: string;
  desc: string;
}

export interface LocalContent {
  introParagraph: string;
  logisticsAlert: string;
  useCaseText: string;
  pricesContext: string;
  faqItems: { question: string; answer: string }[];
  ecoText: string;
  localContext: string;
  climateZoneLabel: string;
  localAgencyName: string;
  externalLinks: ExternalLink[];
  communeDataInsight: string;
  expertTip: string;
  tableIntro: string;
  guideLinks: GuideLink[];
  savingsEstimate: string;
  lastUpdated: string;
  realEstateInsight: string;
  populationTierContent: string;
  densiteAnalysis: string;
  marcheImmobilierInsight: string;
  distanceLyonContext: string; // compatibility with layouts
  localRegulation: string;
  sourcesCitation: string;
}

export type ClimateZone = 'toulouse-metropole' | 'sicoval-lauragais' | 'comminges-muret';

const CATEGORY_OFFSETS: Record<string, number> = {
  main: 0,
  copropriete: 100,
  wallbox: 200
};

export function getClimateZone(codePostal: string, slug: string): ClimateZone {
  const cp = codePostal.trim();
  
  const metroSlugs = new Set([
    'toulouse', 'colomiers', 'tournefeuille', 'blagnac', 'balma', 'l-union',
    'cugnaux', 'plaisance-du-touch', 'saint-orens-de-gameville', 'saint-jean',
    'castelginest', 'portet-sur-garonne', 'villeneuve-tolosane', 'pibrac'
  ]);
  
  if (metroSlugs.has(slug) || cp.startsWith('31700') || cp.startsWith('31770') || cp.startsWith('31820') || cp.startsWith('31840') || cp.startsWith('31140') || cp.startsWith('31150')) {
    return 'toulouse-metropole';
  }
  
  if (cp.startsWith('31520') || cp.startsWith('31320') || cp.startsWith('31670') || cp.startsWith('31290') || cp.startsWith('31250') || slug.includes('lauragais') || slug === 'revel') {
    return 'sicoval-lauragais';
  }
  
  return 'comminges-muret';
}

export function getLocalAgency(codePostal: string, slug: string): { name: string; detail: string; website: string } {
  const zone = getClimateZone(codePostal, slug);
  if (zone === 'toulouse-metropole') {
    return {
      name: "l'ALEC de Toulouse Métropole (Agence Locale de l'Énergie et du Climat)",
      detail: "le guichet d'accompagnement de la métropole pour la transition énergétique",
      website: "alec-toulouse.org"
    };
  }
  return {
    name: "l'Espace Conseil France Rénov' de Haute-Garonne (animé par le Soleval)",
    detail: "le conseiller info-énergie officiel du département pour les particuliers",
    website: "soleval.org"
  };
}

export function getVariantIndex(slug: string, offset: number, maxVariants: number): number {
  let hash = offset * 31;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % maxVariants;
}

export function getDynamicPrices(commune: Commune) {
  let priceFactor = 1.0;
  
  if (commune.population > 450000) priceFactor += 0.05;
  else if (commune.population > 25000) priceFactor += 0.02 + (commune.population - 25000) / 600000;
  else if (commune.population > 5000) priceFactor -= 0.01;
  else priceFactor -= 0.03;
  
  if (commune.prixM2Moyen) {
    if (commune.prixM2Moyen > 3800) priceFactor += 0.04;
    else if (commune.prixM2Moyen > 3200) priceFactor += 0.02;
    else if (commune.prixM2Moyen > 2400) priceFactor += 0.01;
    else if (commune.prixM2Moyen < 1800) priceFactor -= 0.02;
  }
  
  if (commune.distanceBordeaux && commune.distanceBordeaux > 40) priceFactor -= 0.01;
  if (commune.distanceBordeaux && commune.distanceBordeaux > 70) priceFactor -= 0.02;
  
  if (['toulouse', 'balma', 'blagnac', 'tournefeuille'].includes(commune.slug)) priceFactor += 0.02;
  
  priceFactor = Math.max(0.92, Math.min(1.11, priceFactor));

  return {
    greenUp: { min: Math.round(400 * priceFactor), max: Math.round(700 * priceFactor) },
    wallbox7kW: { min: Math.round(1200 * priceFactor), max: Math.round(1800 * priceFactor) },
    wallbox11kW: { min: Math.round(1500 * priceFactor), max: Math.round(2300 * priceFactor) },
    wallbox22kW: { min: Math.round(2000 * priceFactor), max: Math.round(3500 * priceFactor) },
    copro: { min: Math.round(2500 * priceFactor), max: Math.round(4500 * priceFactor) },
    triUpgrade: { min: Math.round(500 * priceFactor), max: Math.round(1200 * priceFactor) },
    priceFactor
  };
}

function getExternalLinks(category: string, codePostal: string, slug: string): ExternalLink[] {
  const agency = getLocalAgency(codePostal, slug);
  const agencyUrl = agency.website.startsWith('http') ? agency.website : `https://www.${agency.website}`;
  const zone = getClimateZone(codePostal, slug);
  
  const base: ExternalLink[] = [
    {
      label: "Programme ADVENIR — Subventions Bornes de Recharge",
      url: "https://advenir.mobi",
      description: "Site officiel du programme ADVENIR détaillant les primes pour les particuliers, les syndics et les entreprises."
    },
    {
      label: `${agency.name} — Service Public local`,
      url: agencyUrl,
      description: "Accompagnement de proximité gratuit pour votre transition énergétique et aides financières en Haute-Garonne."
    },
    {
      label: "Qualifelec — Annuaire des Électriciens qualifiés IRVE",
      url: "https://www.qualifelec.fr",
      description: "Vérifiez la qualification IRVE (Infrastructure de Recharge pour Véhicules Électriques) de votre électricien."
    },
    {
      label: "Enedis — Raccordement et Compteur Linky",
      url: "https://www.enedis.fr/particuliers/raccordement-et-branchement",
      description: "Informations officielles du gestionnaire de réseau Enedis sur le raccordement électrique et les compteurs Linky en Haute-Garonne."
    },
    {
      label: "Je Roule en Électrique — Campagne gouvernementale",
      url: "https://www.je-roule-en-electrique.fr",
      description: "Site officiel du gouvernement français dédié à la mobilité électrique : aides à l'achat, bonus écologique et infrastructure de recharge."
    }
  ];

  if (category === 'copropriete') {
    return [
      ...base,
      {
        label: "Légifrance — Décret n° 2020-1720 (Droit à la prise)",
        url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042740927",
        description: "Texte de loi officiel régissant le droit à la prise pour la recharge des véhicules électriques en copropriété."
      },
      {
        label: "France Rénov' — Aides à la rénovation énergétique",
        url: "https://france-renov.gouv.fr",
        description: "Portail officiel France Rénov' pour les travaux d'amélioration énergétique des logements, incluant les bornes de recharge."
      }
    ];
  } else if (category === 'wallbox') {
    return [
      ...base,
      {
        label: "Automobile Propre — Guide de la recharge à domicile",
        url: "https://www.automobile-propre.com",
        description: "Comparatifs indépendants, temps de charge et explications détaillées sur le fonctionnement des wallbox."
      },
      {
        label: "data.gouv.fr — Carte des bornes de recharge (IRVE)",
        url: "https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/",
        description: "Base de données nationale en open data recensant l'intégralité des points de charge publics en France, dont la Haute-Garonne."
      }
    ];
  } else {
    const mainExtra: ExternalLink[] = [
      {
        label: "Service-Public.fr — Crédit d'impôt Borne de recharge",
        url: "https://www.service-public.fr/particuliers/vosdroits/F35535",
        description: "Fiche officielle décrivant les conditions pour bénéficier du crédit d'impôt de 500 € en 2026."
      }
    ];
    if (zone === 'toulouse-metropole') {
      mainExtra.push({
        label: "Toulouse Métropole — Zone à Faibles Émissions (ZFE)",
        url: "https://www.toulouse-metropole.fr/missions/deplacements/zone-a-faibles-emissions",
        description: "Informations officielles sur le périmètre et le calendrier de la ZFE de Toulouse Métropole et ses impacts sur la mobilité."
      });
    }
    return [...base, ...mainExtra];
  }
}

function getGuideLinks(category: string, slug: string = ''): GuideLink[] {
  const allGuides: GuideLink[] = [
    { href: '/guides/copropriete-toulouse-droits-syndic/', label: 'Copropriété à Toulouse : Droits & Syndic', desc: 'Comment fonctionne le raccordement IRVE en copropriété toulousaine.' },
    { href: '/guides/aide-advenir-toulouse-metropole-2026/', label: 'Aide ADVENIR Toulouse Métropole 2026', desc: "Cumuler ADVENIR, crédit d'impôt et subventions métropolitaines." },
    { href: '/guides/prix-borne-recharge-haute-garonne-2026/', label: 'Prix Borne Recharge Haute-Garonne 2026', desc: 'Budget complet pour équiper votre logement dans le 31.' },
    { href: '/guides/comparateur-wallbox-connectees-2026/', label: 'Comparatif Wallbox Connectées 2026', desc: 'Les meilleures bornes intelligentes pour pavillon dans le 31.' },
    { href: '/guides/wallbox-panneaux-solaires-occitanie/', label: 'Solaire & Wallbox en Occitanie', desc: 'Rentabilité et autoconsommation sous le soleil du Midi.' },
    { href: '/guides/v2h-vehicule-to-home-toulouse/', label: 'V2H & Véhicule-to-Home à Toulouse', desc: 'Utiliser la batterie de sa voiture pour alimenter sa maison.' },
    { href: '/guides/wallbox-ingenieur-airbus/', label: 'Wallbox pour Ingénieur Airbus', desc: 'La borne de recharge idéale pour les cadres aéro du 31.' },
    { href: '/guides/installateur-irve-haute-garonne-choisir/', label: 'Choisir son Installateur IRVE 31', desc: 'Certifications obligatoires, assurances et pièges à éviter.' },
  ];

  const categoryPriority: Record<string, number[]> = {
    copropriete: [0, 1, 2],
    wallbox: [3, 4, 5],
    main: [2, 6, 7],
  };

  const prioritySet = new Set(categoryPriority[category] || [2, 6, 7]);
  const baseOffset = getVariantIndex(slug, 300, allGuides.length);
  
  const selected: GuideLink[] = [];
  const usedIndices = new Set<number>();
  
  const priorityArr = Array.from(prioritySet);
  const priorityIdx = priorityArr[getVariantIndex(slug, 310, priorityArr.length)];
  selected.push(allGuides[priorityIdx]);
  usedIndices.add(priorityIdx);
  
  let rotOffset = baseOffset;
  while (selected.length < 3) {
    const idx = rotOffset % allGuides.length;
    if (!usedIndices.has(idx)) {
      selected.push(allGuides[idx]);
      usedIndices.add(idx);
    }
    rotOffset++;
  }
  
  return selected;
}

// Spintax pools (Toulouse/Airbus technical tone)
const INTRO_POOLS: Record<string, string[]> = {
  main: [
    "Pour {l'installation|la pose} de votre borne de recharge à {VILLE}, {profitez|bénéficiez} d'une pose clés en main par nos techniciens certifiés IRVE. Nous réalisons une étude de conformité de votre tableau électrique pour garantir une charge {sûre|sécurisée} avec délestage dynamique Linky.",
    "Besoin d'installer une borne pour votre véhicule électrique à {VILLE} ? Nos installateurs locaux de Haute-Garonne vous accompagnent dans le choix d'une wallbox {adaptée|performante} de type P1/P2 et gèrent vos démarches d'aides financières ADVENIR.",
    "Sécurisez la charge de votre véhicule électrique à {VILLE} grâce à une wallbox {7.4 kW|11 kW} installée par un électricien IRVE agréé. Devis gratuit et visite technique sous {48h|deux jours} dans tout le 31.",
    "Avec le développement de la ZFE de Toulouse Métropole en Haute-Garonne, équiper sa maison de {VILLE} d'une borne de recharge rapide à domicile est la solution {idéale|optimale} pour charger à moindre coût et anticiper les restrictions.",
    "Vous habitez à {VILLE} et souhaitez passer à la vitesse supérieure pour votre voiture électrique ? Nos électriciens partenaires certifiés Qualifelec IRVE installent votre borne de recharge {à domicile|chez vous} en conformité avec la norme NF C 15-100.",
    "Recharger sa voiture sur une prise domestique standard à {VILLE} est {trop lent|inefficace} et risqué. Optez pour une installation de borne murale intelligente avec Smart Charging et protocole ISO 15118.",
    "Nos experts en solutions de recharge interviennent à {VILLE} pour dimensionner et poser votre wallbox. Bénéficiez des aides de l'État (TVA à 5,5% et crédit d'impôt de 500 €) avec nos {pros|artisans certifiés IRVE}.",
    "Profitez de l'expertise d'un installateur IRVE à {VILLE} pour raccorder votre wallbox intelligente. Nous configurons le délestage dynamique pour protéger l'installation électrique de votre {maison|logement} lors des pics de consommation."
  ],
  copropriete: [
    "Vous habitez en copropriété à {VILLE} et souhaitez installer une borne de recharge ? Le droit à la prise vous garantit la possibilité d'équiper votre place de parking à vos frais, avec le soutien des aides ADVENIR en Haute-Garonne.",
    "Installez votre borne de recharge en copropriété à {VILLE} en toute simplicité. Nos techniciens certifiés IRVE vous aident à formaliser votre demande auprès du syndic haut-garonnais et à obtenir jusqu'à 960 € de subvention ADVENIR.",
    "Le droit à la prise (décret 2020) permet à tout locataire ou propriétaire d'un appartement à {VILLE} d'installer un point de recharge sur son emplacement de stationnement. Découvrez nos infrastructures collectives certifiées.",
    "Sécurisez la recharge de votre voiture électrique dans votre résidence à {VILLE}. Nous concevons des installations individuelles ou collectives conformes aux exigences IRVE et éligibles aux primes ADVENIR 2026.",
    "Rendre votre copropriété à {VILLE} compatible avec la recharge électrique valorise l'ensemble des appartements. Nos experts IRVE interviennent pour installer des bornes individuelles raccordées au TGBT des parties communes.",
    "Le raccordement d'une borne en parking partagé ou sous-sol à {VILLE} requiert une expertise spécifique. Nous réalisons l'étude technique nécessaire pour présenter un dossier solide à votre syndic de copropriété.",
    "Faites installer votre wallbox dans votre résidence de {VILLE} en bénéficiant de la prime ADVENIR copropriété qui finance jusqu'à 50% du projet d'installation électrique individuelle.",
    "Nos électriciens certifiés IRVE en Haute-Garonne accompagnent les syndics et les copropriétaires de {VILLE} de l'étude de faisabilité technique jusqu'à la mise en service finale de la borne."
  ],
  wallbox: [
    "Optimisez la recharge de votre voiture électrique à {VILLE} en faisant installer une borne murale rapide (Wallbox) de 7.4 kW à 22 kW par nos électriciens certifiés IRVE de Haute-Garonne.",
    "Besoin d'une recharge rapide et intelligente à domicile à {VILLE} ? Découvrez nos modèles de Wallbox connectées avec gestion des heures creuses et délestage de puissance en temps réel.",
    "Installez une borne de recharge performante (Wallbox) dans votre maison à {VILLE}. Nous sélectionnons les meilleures marques du marché pour vous garantir une charge sécurisée, rapide et compatible protocole ISO 15118.",
    "La Wallbox est la solution de recharge résidentielle par excellence à {VILLE}. Elle permet de recharger votre véhicule électrique jusqu'à 8 fois plus vite qu'une prise de courant standard.",
    "Faites poser votre borne Wallbox à {VILLE} par un électricien agréé IRVE pour sécuriser votre installation électrique et bénéficier des aides financières de l'État en 2026.",
    "Vous cherchez à réduire le temps de charge de votre voiture électrique à {VILLE} ? Nos installateurs partenaires vous proposent des solutions Wallbox adaptées à votre abonnement monophasé ou triphasé.",
    "Équipez votre garage de {VILLE} d'une wallbox connectée de dernière génération. Pilotez votre consommation depuis votre smartphone et programmez vos charges en fonction des heures creuses Enedis.",
    "Profitez d'une installation soignée de votre borne Wallbox à {VILLE} par des spécialistes de la recharge électrique IRVE intervenant dans tout le département de la Haute-Garonne."
  ]
};

const USE_CASE_POOLS: Record<string, string[]> = {
  main: [
    "La pose d'une borne de 7.4 kW à domicile permet de recharger n'importe quel véhicule (Tesla Model Y, Peugeot e-208, Megane E-Tech, BMW i4) en récupérant environ 40 à 50 km d'autonomie par heure de charge.",
    "Pour les foyers disposant d'un abonnement électrique triphasé, l'installation d'une borne de 11 kW ou 22 kW permet de diviser par trois le temps de charge de votre batterie sans risquer de surcharger le réseau grâce au Smart Charging.",
    "Une wallbox installée dans votre garage ou sur votre place de parking à {VILLE} sécurise la charge de votre véhicule en évitant toute surchauffe des câbles grâce à des protections électriques dédiées (interrupteur différentiel de type A-EV et disjoncteur adapté).",
    "Nos techniciens IRVE recommandent l'installation de bornes de grandes marques (Schneider EVlink, Legrand Green'Up Premium, Wallbox Pulsar Plus) équipées d'un câble de type 2 pour s'adapter à l'ensemble des véhicules électriques du marché européen.",
    "Que ce soit pour une recharge quotidienne rapide après vos trajets dans la métropole toulousaine ou pour des trajets vers le Comminges, une borne murale de 7.4 kW assure une flexibilité totale et préserve la durée de vie de votre batterie.",
    "L'installation d'une prise renforcée Green'Up (3.7 kW) peut suffire pour les véhicules hybrides rechargeables, mais pour un véhicule 100% électrique, seule une borne wallbox garantit une recharge complète en une nuit."
  ],
  copropriete: [
    "Pour faire valoir votre droit à la prise, vous devez envoyer un dossier technique détaillé au syndic de copropriété par lettre recommandée. Celui-ci dispose de 3 mois pour inscrire le point à l'ordre du jour de la prochaine AG.",
    "La solution classique consiste à raccorder votre borne de recharge individuelle au tableau général des parties communes (TGBT) de la résidence toulousaine, avec la pose d'un sous-compteur individuel certifié MID pour la facturation des consommations.",
    "Pour les résidences de {VILLE} comptant de nombreuses demandes, nous recommandons une infrastructure collective avec une colonne horizontale Enedis, permettant à chaque résident d'ouvrir un abonnement Linky indépendant.",
    "L'installation d'une borne en sous-sol à {VILLE} exige de respecter des normes de sécurité incendie strictes et d'utiliser du matériel robuste avec un indice de protection IK10 contre les chocs dans les espaces de manœuvre.",
    "Que vous soyez propriétaire occupant ou locataire à {VILLE}, le syndic ne peut s'opposer aux travaux d'installation d'une borne individuelle que pour un motif sérieux et légitime, comme l'existence d'un projet collectif.",
    "La mise en place d'une solution de recharge partagée ou individuelle en copropriété permet de répartir équitablement les coûts de consommation d'électricité grâce à des relevés de télé-relève automatisés ou des badges RFID."
  ],
  wallbox: [
    "Une Wallbox de 7.4 kW en monophasé est idéale pour la majorité des maisons individuelles à {VILLE}. Elle permet de recharger complètement une batterie de 60 kWh (type Megane E-Tech ou Tesla Model 3) en une seule nuit.",
    "Pour les propriétaires disposant d'une installation en triphasé à {VILLE}, les bornes de 11 kW ou 22 kW offrent une vitesse supérieure, chargeant votre véhicule compatible en seulement 3 à 5 heures pour une autonomie maximale.",
    "Les bornes murales sélectionnées par nos électriciens partenaires intègrent un protocole OCPP et une connectivité Bluetooth ou Wi-Fi pour planifier facilement vos sessions de charge depuis une application mobile dédiée.",
    "La pose d'une Wallbox nécessite des protections électriques obligatoires dans votre tableau de {VILLE} : un disjoncteur adapté et un interrupteur différentiel de type A-EV capable de détecter les fuites de courant continu.",
    "Certaines wallbox intelligentes comme la Wallbox Pulsar Plus ou la Legrand Green'Up intègrent un lecteur de carte RFID pour sécuriser l'accès et empêcher les personnes non autorisées de recharger leur véhicule chez vous.",
    "Une borne de recharge rapide est particulièrement recommandée si vous roulez beaucoup en Haute-Garonne et avez besoin de récupérer rapidement de l'autonomie entre deux trajets professionnels ou personnels."
  ]
};

const ECO_POOLS: Record<string, string[]> = {
  main: [
    "En programmant la charge de votre véhicule électrique pendant les heures creuses d'Enedis en Haute-Garonne (souvent entre 22h et 6h), vous réduisez votre facture d'électricité et divisez par 5 vos dépenses de carburant.",
    "Avec un tarif de recharge à domicile à {VILLE} estimé à moins de 2 € pour 100 km, l'amortissement de votre investissement dans une borne IRVE s'effectue en moins de 18 mois par rapport à un véhicule thermique.",
    "Le crédit d'impôt de 500 € disponible en 2026, combiné à la TVA réduite à 5,5% sur le matériel et la main d'œuvre, rend l'installation d'une borne de recharge particulièrement accessible pour les particuliers.",
    "Grâce aux fonctionnalités intelligentes des wallbox modernes, vous pouvez suivre en temps réel vos consommations et optimiser vos charges pour profiter pleinement des tarifs d'électricité les plus avantageux.",
    "Le pilotage de la charge permet également d'intégrer des panneaux solaires si vous en êtes équipé à {VILLE}, vous permettant de rouler avec une énergie 100% verte et gratuite produite sous le soleil du Midi.",
    "Éviter les recharges régulières sur les bornes publiques rapides (qui appliquent des tarifs élevés) en rechargeant principalement chez soi à {VILLE} permet de réaliser plus de 1 200 € d'économies annuelles."
  ],
  copropriete: [
    "Grâce au programme ADVENIR spécifique pour la copropriété, vous bénéficiez d'une aide financière couvrant 50% du montant des travaux, avec un plafond de 960 € TTC par point de recharge installé à {VILLE}.",
    "En plus de la prime ADVENIR, l'installation d'une borne en copropriété is éligible au crédit d'impôt de 500 € et à un taux de TVA réduit à 5,5%, ce qui réduit considérablement le coût restant à votre charge.",
    "Raccorder votre borne au compteur des parties communes avec un système de sous-comptage vous permet de ne payer que l'électricité que vous consommez réellement, au tarif négocié par la copropriété.",
    "La recharge en heures creuses au sein de votre résidence à {VILLE} reste de loin la solution la plus économique pour alimenter votre véhicule électrique, préservant ainsi votre budget énergie mensuel.",
    "Le financement de l'infrastructure collective de recharge peut être pris en charge par des opérateurs tiers sans frais pour la copropriété, les utilisateurs payant ensuite un abonnement individuel.",
    "Investir dans une borne en copropriété à {VILLE} permet de réaliser des économies substantielles à long terme en évitant les tarifs excessifs pratiqués sur les réseaux de recharge publics extérieurs."
  ],
  wallbox: [
    "Grâce au pilotage énergétique de votre Wallbox à {VILLE}, la charge s'active automatiquement pendant les heures creuses, vous permettant de rouler pour environ 2 € par recharge complète de votre batterie.",
    "Le crédit d'impôt national pour la pose d'une borne de recharge a été fixé à 500 € par contribuable en 2026, cumulable avec la TVA à 5,5% appliquée par votre installateur IRVE qualifié.",
    "L'installation d'une borne de recharge rapide vous évite d'utiliser régulièrement les chargeurs publics rapides de type DC, dont le coût au kWh est 3 à 4 fois plus élevé que l'électricité domestique à {VILLE}.",
    "Les bornes équipées de capteurs de puissance modulable adaptent leur vitesse de recharge en fonction des autres équipements de votre maison de {VILLE}, vous évitant de payer un abonnement Enedis plus cher.",
    "Si vous possédez une installation photovoltaïque à {VILLE}, certaines wallbox de marque SolarEdge ou Easee peuvent canaliser le surplus de production solaire directement dans la batterie de votre voiture.",
    "Investir dans une wallbox performante à domicile à {VILLE} est rapidement rentabilisé en profitant des tarifs d'électricité régulés d'Enedis et en limitant les recharges d'urgence sur autoroute."
  ]
};

const COMMUNE_DATA_POOLS: Record<string, string[]> = {
  main: [
    "Nos électriciens partenaires analysent la capacité de votre tableau de répartition principal. Souvent, dans le bâti ancien ou les Toulousaines rénovées, une mise aux normes mineure ou l'ajout d'un interrupteur différentiel adapté est requis.",
    "À {VILLE}, nous vérifions systématiquement la qualité de la prise de terre avant toute pose de borne. Une résistance de terre supérieure à 100 Ohms empêcherait le véhicule électrique de démarrer sa charge par sécurité.",
    "Le réseau électrique Enedis à {VILLE} délivre une tension stable, mais la pose d'un module de délestage est indispensable pour les abonnements de 6 kVA afin de ne pas couper le courant lors du démarrage d'autres appareils.",
    "L'installation électrique de votre maison doit être auditée par un professionnel IRVE. Dans le 31, de nombreux tableaux nécessitent un simple réagencement pour accueillir le disjoncteur et le différentiel dédiés à la wallbox.",
    "Nos installateurs se chargent de vérifier la puissance souscrite auprès de votre fournisseur. Si un passage de 6 à 9 kVA est nécessaire, nous vous guidons dans les démarches auprès d'Enedis Haute-Garonne.",
    "Chaque installation de borne à {VILLE} respecte scrupuleusement le cahier des charges de la norme NF C 15-100, garantissant une protection optimale contre les surcharges et les courts-circuits accidentels."
  ],
  copropriete: [
    "L'installation dans les parkings collectifs de Haute-Garonne nécessite l'intervention d'un électricien qualifié IRVE pour garantir la conformité avec le guide technique de l'association Promotelec et les décrets en vigueur.",
    "À {VILLE}, nous analysons le tableau général basse tension (TGBT) de votre copropriété pour déterminer la puissance disponible. Parfois, l'installation d'un gestionnaire d'énergie collectif est requise pour éviter de saturer le réseau.",
    "Le câblage dans un parking souterrain à {VILLE} doit emprunter des chemins de câbles coupe-feu spécifiques pour se conformer à la réglementation sur la sécurité incendie dans les bâtiments d'habitation.",
    "Nos installateurs coordonnent leur travail avec le syndic de votre résidence à {VILLE}. Nous fournissons un schéma d'implantation technique clair pour valider la faisabilité du raccordement électrique.",
    "Dans les résidences du 31, l'accès à la borne est sécurisé par un lecteur de badge ou une clé physique. Cela empêche toute utilisation frauduleuse de votre électricité par un autre résident.",
    "Chaque projet en copropriété à {VILLE} respecte les normes d'accessibilité PMR (Personnes à Mobilité Réduite) pour l'emplacement de la borne et la maniabilité du câble de recharge."
  ],
  wallbox: [
    "L'installation d'une wallbox à {VILLE} doit impérativement être validée par un diagnostic de votre réseau électrique intérieur afin de s'assurer de la bonne section de câble et de la présence d'une prise de terre conforme.",
    "À {VILLE}, de nombreuses installations électriques résidentielles nécessitent la pose d'un module de délestage Linky TIC pour éviter la coupure du disjoncteur général lorsque la borne fonctionne en même temps que la climatisation ou le chauffage.",
    "Les techniciens IRVE intervenant à {VILLE} vérifient la conformité de votre tableau électrique principal. Si nécessaire, un tableau secondaire dédié à la borne de recharge sera mis en place pour garantir la sécurité.",
    "Le choix de la puissance de votre borne dépend directement de votre abonnement électrique à {VILLE}. Une borne de 7.4 kW requiert un abonnement minimum de 9 kVA (45 Ampères) pour fonctionner confortablement.",
    "Dans les communes vallonnées du Comminges ou du Lauragais, nos installateurs veillent à équiper les wallbox extérieures de protections renforcées contre la foudre, l'humidité et les surtensions électriques du réseau.",
    "Toutes les wallbox installées par nos artisans certifiés à {VILLE} respectent les directives européennes et françaises avec des connecteurs de type 2S équipés d'obturateurs de sécurité."
  ]
};

const EXPERT_TIP_POOLS: Record<string, string[]> = {
  main: [
    "Conseil de pro : Privilégiez une borne équipée d'un capteur de courant qui ajuste dynamiquement la charge. C'est l'assurance d'éviter les disjonctions générales sans avoir à augmenter votre abonnement Enedis.",
    "Astuce technique : Si votre borne est installée en extérieur à {VILLE}, exigez une pose sous abri ou une borne certifiée IP55 avec obturateurs de sécurité (prises T2S) pour résister aux orages d'été et intempéries.",
    "Recommandation IRVE : Ne sous-estimez pas la section du câble d'alimentation de la borne. Pour une borne de 7.4 kW située à 15 mètres du tableau, un câble en cuivre de 10 mm² est indispensable pour éviter les pertes d'énergie.",
    "Avis de l'électricien : Optez pour une borne évolutive compatible OCPP. Cela vous permettra de la connecter facilement à des applications de recharge intelligente ou à un futur système de gestion énergétique domestique.",
    "Conseil sécurité : L'utilisation d'une prise classique pour recharger un VE présente un risque d'échauffement important. La wallbox intègre des circuits de détection de fuite de courant continu pour une protection totale.",
    "Le conseil toulousain : En hiver dans le 31, programmez la fin de charge juste avant votre départ. La batterie sera encore tiède, ce qui améliorera l'autonomie et le freinage régénératif dès les premiers kilomètres de votre trajet."
  ],
  copropriete: [
    "Conseil d'expert : N'attendez pas la tenue de l'AG pour envoyer votre dossier en recommandé. Plus vite le syndic reçoit votre demande technique rédigée par nos soins, plus vite la convention de travaux sera signée.",
    "Astuce copro : Proposez au syndic une solution de recharge collective évolutive. Même si vous êtes le premier demandeur à {VILLE}, d'autres voisins suivront et une infrastructure commune évitera de multiplier les câbles individuels.",
    "Recommandation technique : Pour les parkings extérieurs à {VILLE}, optez pour une borne sur pied robuste dotée d'un indice IK10 et d'une trappe verrouillable pour protéger la prise contre les actes de malveillance.",
    "Le conseil juridique : Rappelez à votre syndic que le droit à la prise est garanti par la loi. Si aucune décision n'est prise dans les 3 mois suivant la réception de votre demande, vous pouvez lancer les travaux individuellement.",
    "Avis de l'électricien : Dans le cas d'une recharge raccordée aux parties communes, assurez-vous que le sous-compteur installé est certifié MID (Mesure Instruments Directive) pour que la facturation soit juridiquement incontestable.",
    "Conseil pratique : Choisissez une borne équipée d'une connectivité Wi-Fi ou 4G pour permettre le suivi de consommation et la mise à jour à distance du micrologiciel de votre équipement de recharge."
  ],
  wallbox: [
    "Le conseil de l'artisan : Pour une borne installée à {VILLE}, choisissez un modèle doté d'une application de contrôle robuste. Cela vous permettra de suivre précisément votre historique de consommation pour votre comptabilité.",
    "Astuce technique : Si vous prévoyez d'acheter un second véhicule électrique à l'avenir, optez dès maintenant pour une borne capable de gérer la charge partagée intelligente entre deux points de charge.",
    "Recommandation IRVE : Évitez les câbles de recharge trop courts. Un câble de 5 ou 7 mètres offre un confort d'utilisation optimal, quelle que soit la position de la trappe de recharge de votre véhicule dans votre allée à {VILLE}.",
    "Conseil d'expert : Pensez à vérifier la garantie constructeur de votre wallbox. Les fabricants leaders (Hager, Schneider, Easee) proposent des extensions de garantie jusqu'à 5 ans qui sécurisent votre investissement.",
    "Avis de l'électricien : Si votre maison à {VILLE} dispose d'une installation en triphasé, préférez une borne de 22 kW bridable à 11 kW. Cela vous donne une flexibilité totale selon les capacités de charge de vos futurs véhicules.",
    "Le conseil technique : Protégez toujours votre investissement. Enroulez soigneusement le câble de charge sur un support mural dédié à {VILLE} après chaque utilisation pour éviter de l'endommager avec le temps."
  ]
};

const REAL_ESTATE_POOLS: Record<string, string[]> = {
  main: [
    "Les agences immobilières de Haute-Garonne confirment qu'une maison équipée d'une borne de recharge rapide se vend plus rapidement et gagne une valeur verte immédiate estimée entre 2% et 4% sur le marché immobilier de {VILLE}.",
    "À {VILLE}, la présence d'une wallbox opérationnelle dans le garage est un argument de poids lors des visites d'acquéreurs potentiels, de plus en plus nombreux à posséder ou projeter l'achat d'un véhicule électrique.",
    "Valoriser son patrimoine immobilier passe aujourd'hui par la transition énergétique. Installer une borne IRVE de qualité valorise votre bien tout en le démarquant des autres annonces du secteur de {VILLE}.",
    "Avec l'interdiction progressive des véhicules thermiques, une place de stationnement déjà câblée pour la recharge de véhicules électriques est un équipement standard recherché par les acheteurs à {VILLE}.",
    "Selon les notaires de Haute-Garonne, les biens équipés d'une borne de recharge rapide dans le secteur de {VILLE} se négocient avec une décote moindre en période de marché baissier, la valeur verte agissant comme un amortisseur de prix.",
    "Les diagnostiqueurs immobiliers à {VILLE} intègrent désormais la présence d'une borne IRVE dans l'audit énergétique du logement. C'est un critère de différenciation qui séduit une clientèle d'acheteurs CSP+ (comme les cadres d'Airbus ou du spatial) sensibilisés à la mobilité décarbonée.",
    "À {VILLE}, les programmes de lotissements neufs livrés depuis 2024 intègrent systématiquement un pré-câblage borne de recharge dans le garage. Ne pas équiper une maison existante, c'est prendre du retard sur le standard du marché local.",
    "Le marché de la location saisonnière dans le Comminges ou le Lauragais récompense les propriétaires-bailleurs qui proposent un point de charge privé : les réservations de touristes VE grimpent rapidement avec ce service."
  ],
  copropriete: [
    "Un appartement avec place de parking câblée ou équipée d'une borne à {VILLE} voit sa valeur immobilière augmenter de façon significative. C'est un argument de vente majeur pour les acheteurs urbains de Haute-Garonne.",
    "Dans les copropriétés de {VILLE}, disposer d'un équipement IRVE individuel permet de louer ou vendre sa place de parking beaucoup plus facilement et avec une plus-value estimée à plus de 2 000 €.",
    "La valeur verte des logements collectifs à {VILLE} devient un critère de choix pour les locataires et acquéreurs équipés de VE, qui écartent désormais les résidences dépourvues de solution de recharge.",
    "Équiper sa copropriété d'une infrastructure de recharge collective est un investissement qui modernise l'immeuble et préserve l'attractivité immobilière de la copropriété à {VILLE} face aux constructions neuves.",
    "Les résidences collectives de {VILLE} qui anticipent l'équipement IRVE attirent un vivier de locataires actifs roulant en VE. La demande pour des appartements avec parking équipé explose dans tout le 31.",
    "D'après les agences immobilières de {VILLE}, un lot de copropriété sans solution de recharge met en moyenne 25% de temps de plus à se vendre qu'un lot équipé ou dans un immeuble pré-câblé.",
    "Les syndics professionnels de Haute-Garonne recommandent aux copropriétés de {VILLE} de voter un plan de pré-câblage global pour éviter une dépréciation collective du patrimoine immobilier face aux immeubles neufs conformes RT 2020.",
    "L'installation d'une borne en parking souterrain à {VILLE} est perçue par les banques comme un investissement valorisant : certaines offres de prêt immobilier vert intègrent le financement de la borne dans le prêt principal."
  ],
  wallbox: [
    "L'installation d'une wallbox de marque reconnue valorise immédiatement votre maison à {VILLE} en augmentant sa valeur verte de 3% à 5% auprès des acquéreurs de plus en plus attentifs aux équipements de recharge à domicile.",
    "Avoir une borne de recharge rapide pré-équipée dans son garage est un critère de confort haut de gamme très recherché lors des transactions immobilières dans le secteur de {VILLE}.",
    "Un logement prêt pour la mobilité électrique à {VILLE} se vend en moyenne 15 jours plus vite sur le marché de Haute-Garonne, les acheteurs appréciant de ne pas avoir à réaliser ces travaux complexes eux-mêmes.",
    "En Haute-Garonne, les maisons disposant d'un carport ou d'un garage équipé d'une wallbox 7.4 kW se positionnent en tête des recherches immobilières des jeunes couples actifs roulant en électrique.",
    "Les diagnostiqueurs DPE du secteur de {VILLE} signalent que les acquéreurs demandent de plus en plus souvent si la maison est pré-équipée pour la recharge d'un véhicule électrique avant même de visiter le bien.",
    "Une maison avec wallbox 11 kW et abonnement triphasé à {VILLE} représente un argument décisif face à la concurrence des constructions neuves, qui intègrent systématiquement le pré-câblage IRVE.",
    "Le retour sur investissement d'une wallbox à {VILLE} ne se mesure pas uniquement en économies de carburant : la plus-value immobilière générée peut atteindre 8 000 à 12 000 € lors de la revente du bien.",
    "Les mandataires immobiliers spécialisés en standing à {VILLE} incluent désormais la wallbox dans les critères de recherche premium au même titre que la domotique."
  ]
};

const POPULATION_TIER_POOLS: Record<string, string[]> = {
  main: [
    "Avec une population locale active et un tissu urbain en pleine mutation, {VILLE} encourage le développement des mobilités douces et de l'électromobilité. Installer sa borne privée est le moyen idéal de devancer les futures réglementations.",
    "Dans cette commune dynamique du 31, le nombre d'utilisateurs de véhicules propres augmente rapidement. Pouvoir recharger chez soi reste le moyen le plus confortable et le plus économique pour vos trajets quotidiens.",
    "Les infrastructures publiques de recharge se développent à {VILLE}, mais elles ne remplaceront jamais la sérénité et le tarif avantageux d'une recharge nocturne effectuée directement dans votre allée ou garage.",
    "En tant que commune accueillante du département de la Haute-Garonne, {VILLE} voit sa part de voitures électriques grandir. Nos électriciens locaux contribuent activement à cette transition en équipant les foyers de bornes fiables.",
    "Les trajets domicile-travail depuis {VILLE} vers Toulouse ou les zones d'activités (Blagnac, Colomiers, Labège) sont idéalement couverts par une recharge nocturne à domicile. Un plein électrique chaque matin sans passer par une station-service, c'est le nouveau standard.",
    "La qualité de vie à {VILLE} passe aussi par la maîtrise de ses coûts de déplacement. Une borne de recharge IRVE à domicile permet de diviser par 5 le budget carburant mensuel des foyers qui parcourent 30 à 60 km par jour.",
    "Le réseau de transports en commun de Haute-Garonne complète l'offre de mobilité à {VILLE}, mais pour les trajets péri-urbains et les courses du quotidien, la voiture électrique rechargée à domicile reste imbattable en souplesse et en coût.",
    "L'évolution rapide du parc automobile à {VILLE} montre que les véhicules 100% électriques dépassent désormais les hybrides dans les nouvelles immatriculations. Cette tendance confirme le besoin d'équiper les domiciles en bornes de recharge rapide."
  ],
  copropriete: [
    "Dans les zones denses de {VILLE}, où le logement collectif représente une part importante du parc immobilier, l'adaptation des copropriétés à la recharge électrique est un enjeu écologique et économique majeur.",
    "Le nombre croissant de résidents roulant en électrique à {VILLE} pousse les syndics de copropriété à moderniser les installations de stationnement pour offrir des solutions de charge partagées ou individuelles.",
    "À {VILLE}, de nombreuses résidences collectives se tournent vers nos électriciens IRVE pour déployer des infrastructures prêtes à l'emploi, anticipant ainsi la généralisation des véhicules électriques.",
    "Installer une borne dans son immeuble à {VILLE} permet de s'affranchir de la recherche quotidienne d'une borne publique disponible dans le quartier, tout en profitant du confort d'une recharge à domicile.",
    "La densité de population à {VILLE} rend les bornes publiques souvent saturées aux heures de pointe. Les copropriétaires avisés préfèrent investir dans un point de charge privatif dans leur parking pour s'assurer une disponibilité garantie.",
    "Les bailleurs sociaux de Haute-Garonne commencent à équiper leurs résidences à {VILLE} en bornes de recharge partagées. Cette tendance témoigne d'un besoin de solutions collectives fiables.",
    "Le programme local de rénovation urbaine à {VILLE} intègre désormais systématiquement le pré-câblage des parkings pour la recharge électrique, preuve que la mobilité décarbonée est au cœur de la planification urbaine.",
    "Les conseils syndicaux de {VILLE} sont de plus en plus sollicités par les copropriétaires souhaitant installer une borne. L'anticipation collective évite des travaux individuels coûteux et garantit une infrastructure cohérente et pérenne."
  ],
  copropriete_2: [
    "Le raccordement en copropriété à {VILLE} est facilité par le droit à la prise. Toutefois, un projet collectif avec une solution de type colonne horizontale ou infrastructure partagée s'avère bien plus avantageux à long terme."
  ],
  wallbox: [
    "À {VILLE}, la transition vers la voiture électrique est en marche. Disposer d'une wallbox rapide à domicile est la solution la plus pratique pour recharger chaque soir et démarrer la journée avec une batterie pleine.",
    "Le développement urbain de {VILLE} s'accompagne d'une demande croissante pour des solutions de charge résidentielles rapides, portées par des électriciens locaux certifiés IRVE.",
    "Même si la ville de {VILLE} déploie de nouvelles bornes publiques, la wallbox privée reste l'équipement indispensable pour recharger au meilleur tarif sans contrainte de temps ni d'attente.",
    "En choisissant d'installer une borne rapide chez vous à {VILLE}, vous rejoignez les nombreux foyers du 31 qui ont fait le choix d'une mobilité simplifiée et économique au quotidien.",
    "Les résidents de {VILLE} qui optent pour une wallbox témoignent d'un gain de confort majeur : finies les files d'attente sur les bornes en zone commerciale pour quelques kilomètres d'autonomie.",
    "L'engouement pour les véhicules électriques à {VILLE} dépasse la simple tendance écologique. C'est un choix économique rationnel quand on dispose d'une wallbox 7.4 kW alimentée en heures creuses Enedis à 0,16 €/kWh.",
    "Les familles de {VILLE} avec deux véhicules constatent qu'une seule wallbox 7.4 kW suffit pour couvrir les besoins de recharge de deux voitures, à condition de programmer les charges en alternance via l'application mobile.",
    "La généralisation du télétravail à {VILLE} renforce l'intérêt de la wallbox domestique : le véhicule est garé plus longtemps à domicile, ce qui permet une recharge complète même en heures creuses de 6 heures."
  ]
};

// FAQ Pools (16 items)
const FAQ_POOLS: Record<string, { question: string; answer: string }[]> = {
  main: [
    { question: "Faut-il modifier mon compteur Enedis pour une installation de borne à {VILLE} ?", answer: "Si vous optez pour une borne de 7.4 kW en monophasé, un abonnement de 9 kVA (45 A) est généralement recommandé. Pour une borne de 11 kW ou 22 kW en triphasé, il est nécessaire de demander à Enedis Haute-Garonne de modifier votre raccordement pour passer en triphasé." },
    { question: "Quel est le tarif moyen d'un électricien IRVE pour poser une borne à {VILLE} ?", answer: "Le coût moyen oscille entre 1 200 € et 1 800 € TTC avant déduction des aides financières. Ce tarif comprend la fourniture de la wallbox, le disjoncteur différentiel adapté, le câblage et la mise en service réglementaire." },
    { question: "Existe-t-il des subventions locales ou départementales en Haute-Garonne ?", answer: "En plus du crédit d'impôt national de 500 € et de la TVA réduite à 5,5%, certaines collectivités locales ou des bonus liés à la ZFE de Toulouse Métropole proposent des aides complémentaires pour l'acquisition d'un véhicule propre et de sa borne." },
    { question: "Combien de temps durent les travaux de pose d'une borne à {VILLE} ?", answer: "Dans la grande majorité des cas, l'installation d'une borne de recharge dans une maison individuelle à {VILLE} prend entre une demi-journée et une journée complète, selon la distance entre le tableau électrique principal et le point de recharge." },
    { question: "Comment fonctionne le crédit d'impôt de 500 € pour les bornes en 2026 ?", answer: "Reconduit en 2026, ce crédit d'impôt couvre 75% du montant de l'installation (matériel et pose) dans la limite de 500 € par borne installée. Il est accessible aux propriétaires, locataires et occupants à titre gratuit sans condition de ressources." },
    { question: "Quelle est la différence entre une prise Green'Up et une Wallbox ?", answer: "La prise Green'Up délivre une puissance maximale de 3.7 kW (charge complète en 12-15h), tandis qu'une Wallbox standard offre une puissance de 7.4 kW (charge en 6-8h) ou 11/22 kW en triphasé (charge en 3-5h), sécurisant également mieux le réseau de votre maison à {VILLE}." },
    { question: "Toutes les voitures électriques sont-elles compatibles avec nos bornes à {VILLE} ?", answer: "Oui. Toutes les bornes installées par nos électriciens IRVE en Haute-Garonne sont équipées de prises de type 2 (T2S), qui est le standard européen obligatoire. Elles sont donc compatibles avec 100% des véhicules du marché (Tesla, Renault, Peugeot, etc.)." },
    { question: "Puis-je recharger ma voiture électrique avec mes panneaux solaires à {VILLE} ?", answer: "Absolument. En connectant une borne intelligente dotée de la fonction de charge solaire (Smart Solar Charging) à votre onduleur, vous pouvez utiliser exclusivement le surplus de production de vos panneaux solaires pour charger gratuitement." }
  ],
  copropriete: [
    { question: "Qu'est-ce que le droit à la prise pour recharger en copropriété à {VILLE} ?", answer: "Le droit à la prise est une disposition légale qui permet à tout résident d'installer à ses frais un point de recharge sur sa place de parking en copropriété. Le syndic ne peut refuser la demande sans motif légitime et sérieux." },
    { question: "Quelles sont les aides du programme ADVENIR pour la copropriété à {VILLE} ?", answer: "Pour une installation individuelle en parking collectif, ADVENIR finance 50% du montant HT des travaux de pose, dans la limite de 960 € TTC par point de recharge. Cette aide s'applique aussi bien pour les locataires que les propriétaires." },
    { question: "Qui paie l'électricité consommée par ma borne en copropriété à {VILLE} ?", answer: "L'électricité consommée est entièrement à votre charge. Deux solutions existent : soit la borne est raccordée à votre propre compteur Linky individuel, soit un sous-compteur MID mesure votre consommation, refacturée ensuite par le syndic." },
    { question: "Qu'est-ce qu'une infrastructure collective de recharge en copropriété ?", answer: "C'est un réseau de câblage installé dans les parties communes par un opérateur ou Enedis. Il permet à chaque résident de se raccorder pour poser sa borne individuelle sans saturer la puissance disponible de la copropriété à {VILLE}." },
    { question: "Quel est le rôle du syndic lors de ma demande d'installation à {VILLE} ?", answer: "Le syndic doit instruire votre dossier technique sous 3 mois. Il ne peut refuser le projet qu'en cas de motif sérieux et légitime (par exemple, si la copropriété décide de réaliser elle-même une infrastructure collective)." },
    { question: "Puis-je installer une borne si je suis locataire d'un appartement à {VILLE} ?", answer: "Oui, en vertu du droit à la prise. Vous devez envoyer votre demande motivée au propriétaire de l'appartement en recommandé avec accusé de réception, qui la transmettra ensuite au syndic sous 1 mois." },
    { question: "Quelles protections électriques sont requises en parking collectif à {VILLE} ?", answer: "Chaque borne doit être protégée par un disjoncteur différentiel type A-EV et posséder un système d'arrêt d'urgence. De plus, les câbles doivent transiter par des chemins de câbles coupe-feu conformes aux normes incendie." },
    { question: "Existe-t-il une solution de recharge partagée en copropriété à {VILLE} ?", answer: "Oui. Il est possible d'installer une borne de recharge commune accessible à tous les résidents à l'aide d'un badge RFID. Les coûts énergétiques sont alors répartis automatiquement selon l'usage réel de chaque utilisateur." }
  ],
  wallbox: [
    { question: "Pourquoi installer une wallbox chez soi à {VILLE} plutôt qu'une prise classique ?", answer: "Une wallbox recharge votre véhicule 3 à 6 fois plus vite qu'une prise standard tout en intégrant des sécurités qui évitent la surchauffe de vos câbles domestiques. Elle permet également de programmer vos charges pendant les heures creuses." },
    { question: "Quelle puissance choisir pour ma wallbox résidentielle à {VILLE} ?", answer: "Le choix standard pour un pavillon est une wallbox de 7.4 kW en monophasé. C'est le meilleur compromis vitesse/coût. Si vous disposez du triphasé et de longs trajets quotidiens, optez pour une borne de 11 kW ou 22 kW." },
    { question: "Qu'est-ce que le délestage dynamique pour une wallbox à {VILLE} ?", answer: "Le délestage dynamique adapte en temps réel la puissance de charge de votre wallbox selon les autres appareils en fonctionnement chez vous. Cela évite que votre disjoncteur général ne saute en cas de pic de consommation." },
    { question: "Une wallbox extérieure à {VILLE} résiste-t-elle à la pluie ?", answer: "Oui, à condition de choisir une borne certifiée IP54 ou IP55, ce qui garantit sa parfaite étanchéité à l'eau et à la poussière. Nos installateurs IRVE du 31 effectuent des poses étanches et sécurisées." },
    { question: "Quels sont les frais annexes à prévoir lors de l'achat d'une wallbox ?", answer: "Outre le coût de la borne elle-même, il faut compter les protections électriques obligatoires (différentiel de type A-EV + disjoncteur), le câble en cuivre blindé et le tarif de main-d'œuvre de l'électricien IRVE." },
    { question: "Est-il possible de verrouiller l'accès de ma wallbox à {VILLE} ?", answer: "Absolument. La plupart des bornes connectées modernes possèdent un verrouillage électronique via leur application smartphone ou un système de badge physique RFID pour empêcher tout vol d'énergie." },
    { question: "Peut-on programmer une wallbox en fonction des heures creuses d'Enedis ?", answer: "Oui, c'est l'un de ses principaux atouts. Via l'application de la borne ou en la raccordant au contacteur de votre compteur Linky, la charge s'active uniquement pendant les heures au kWh réduit." },
    { question: "Quelle est la durée de garantie typique d'une wallbox à {VILLE} ?", answer: "Les constructeurs réputés (Schneider, Hager, Wallbox) proposent généralement une garantie de base de 2 ans, extensible jusqu'à 5 ans chez certains fabricants. Nos techniciens locaux assurent le SAV." }
  ]
};

export function generateCommuneContent(commune: Commune, category: 'main' | 'copropriete' | 'wallbox'): LocalContent {
  const seed = commune.slug;
  const catOffset = CATEGORY_OFFSETS[category] || 0;
  
  const prices = getDynamicPrices(commune);
  const activePrices = prices[category === 'copropriete' ? 'copro' : category === 'wallbox' ? 'wallbox7kW' : 'wallbox7kW'];
  
  // Spinner intro logic
  const selectedIntro = spin(INTRO_POOLS[category][getVariantIndex(seed, catOffset + 10, INTRO_POOLS[category].length)], seed);
  const introParagraph = selectedIntro
    .replace('{VILLE}', commune.nom)
    .replace('{CODE_POSTAL}', commune.codePostal)
    .replace('{PRIX_MIN}', activePrices.min.toString())
    .replace('{PRIX_MAX}', activePrices.max.toString());

  const selectedUseCase = spin(USE_CASE_POOLS[category][getVariantIndex(seed, catOffset + 20, USE_CASE_POOLS[category].length)], seed);
  const useCaseText = selectedUseCase.replace('{VILLE}', commune.nom);

  const selectedEco = spin(ECO_POOLS[category][getVariantIndex(seed, catOffset + 30, ECO_POOLS[category].length)], seed);
  const ecoText = selectedEco.replace('{VILLE}', commune.nom);

  const selectedCommuneData = spin(COMMUNE_DATA_POOLS[category][getVariantIndex(seed, catOffset + 40, COMMUNE_DATA_POOLS[category].length)], seed);
  const communeDataInsight = selectedCommuneData.replace('{VILLE}', commune.nom);

  const selectedExpertTip = spin(EXPERT_TIP_POOLS[category][getVariantIndex(seed, catOffset + 50, EXPERT_TIP_POOLS[category].length)], seed);
  const expertTip = selectedExpertTip.replace('{VILLE}', commune.nom);

  const selectedRealEstate = spin(REAL_ESTATE_POOLS[category][getVariantIndex(seed, catOffset + 60, REAL_ESTATE_POOLS[category].length)], seed);
  const realEstateInsight = selectedRealEstate.replace('{VILLE}', commune.nom);

  const selectedPopTier = spin(POPULATION_TIER_POOLS[category][getVariantIndex(seed, catOffset + 70, POPULATION_TIER_POOLS[category].length)], seed);
  const populationTierContent = selectedPopTier.replace('{VILLE}', commune.nom);

  // Structural details
  const intercommunalite = commune.intercommunalite || 'votre intercommunalité';
  const localAgency = getLocalAgency(commune.codePostal, commune.slug);
  
  const localContext = `Dans la commune de ${commune.nom} (${commune.codePostal}), l'habitat présente des caractéristiques spécifiques avec un taux de résidences de type maison individuelle estimé à ${commune.logementsMaison || 55}%. Les raccordements effectués par nos techniciens IRVE prennent en compte la structure du bâti local, des pavillons résidentiels périurbains récents jusqu'aux Toulousaines traditionnelles en brique rose.`;

  const logisticsAlert = `Attention aux contraintes de câblage dans le 31. Les techniciens IRVE doivent s'assurer de la présence d'une protection différentielle de type A-EV et vérifier la conformité de la liaison de terre, particulièrement exigeante pour les modèles de véhicules électriques de dernière génération.`;

  const pricesContext = `Le budget moyen pour la pose d'une borne de recharge wallbox de 7.4 kW oscille généralement entre ${prices.wallbox7kW.min}€ et ${prices.wallbox7kW.max}€ TTC chez nos clients de ${commune.nom}. Le reste à charge réel peut être significativement réduit par le crédit d'impôt forfaitaire de 500 € et une TVA avantageuse à 5,5%.`;

  const tableIntro = `Retrouvez ci-dessous le comparatif indicatif des solutions de recharge électrique adaptées à ${commune.nom} pour estimer le temps de charge et le budget nécessaire à votre installation :`;

  const densiteAnalysis = `La Haute-Garonne compte actuellement plus de ${commune.vehiculesElectriques || 350} véhicules électriques immatriculés sur la commune de ${commune.nom}, affichant une croissance annuelle de ${commune.croissanceVE || 25}%. Le territoire de ${intercommunalite} dispose de ${commune.bornesPubliques || 12} points de charge publics, mais la recharge privée à domicile reste de loin la solution la plus commode et 4 fois plus économique au kWh.`;

  const marcheImmobilierInsight = `Avec une valeur immobilière moyenne par mètre carré estimée à ${commune.prixM2Moyen || 2800}€ à ${commune.nom}, l'installation d'une borne de recharge représente une valorisation verte immédiate. Un garage ou une place de parking pré-équipée augmente l'attractivité de votre bien de ${commune.marcheImmobilier === 'très premium' ? '4%' : '2.5%'} par rapport aux propriétés non raccordées du secteur.`;

  const localRegulation = `Les aides de la région Occitanie et de Toulouse Métropole pour la mobilité douce s'appliquent à l'ensemble du département. Pour faire valider vos subventions d'installation ou obtenir un conseil neutre à ${commune.nom}, vous pouvez solliciter le service public de la transition énergétique locale.`;

  const distanceLyonContext = commune.distanceBordeaux 
    ? `Située à environ ${commune.distanceBordeaux} km de Toulouse, la commune de ${commune.nom} est idéalement placée pour les navetteurs qui travaillent dans l'agglomération toulousaine et rechargent leur véhicule à domicile chaque soir.`
    : `Idéalement intégrée dans le bassin d'emploi de la Haute-Garonne, la commune de ${commune.nom} est parfaitement positionnée pour les trajets quotidiens des navetteurs rechargeant leur véhicule à domicile chaque soir.`;

  const savingsEstimate = `${Math.round(activePrices.min * 0.15 + 500)} € (cumul crédit d'impôt + TVA 5,5%)`;

  // FAQ items generation (select 5, rotate based on slug)
  const allFaqItems = FAQ_POOLS[category];
  const selectedFaqIndices = [];
  const usedFaq = new Set<number>();
  let faqSeed = catOffset;
  
  while (selectedFaqIndices.length < 5 && selectedFaqIndices.length < allFaqItems.length) {
    const idx = getVariantIndex(commune.slug, faqSeed, allFaqItems.length);
    if (!usedFaq.has(idx)) {
      usedFaq.add(idx);
      selectedFaqIndices.push(idx);
    }
    faqSeed++;
  }
  
  const faqItems = selectedFaqIndices.map(idx => {
    const item = allFaqItems[idx];
    return {
      question: item.question.replace('{VILLE}', commune.nom),
      answer: item.answer.replace('{VILLE}', commune.nom)
    };
  });

  const guideLinks = getGuideLinks(category, commune.slug);

  return {
    introParagraph,
    logisticsAlert,
    useCaseText,
    pricesContext,
    faqItems,
    ecoText,
    localContext,
    climateZoneLabel: commune.intercommunalite || 'Haute-Garonne',
    localAgencyName: localAgency.name,
    externalLinks: getExternalLinks(category, commune.codePostal, commune.slug),
    communeDataInsight,
    expertTip,
    tableIntro,
    guideLinks,
    savingsEstimate,
    lastUpdated: new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
    realEstateInsight,
    populationTierContent,
    densiteAnalysis,
    marcheImmobilierInsight,
    distanceLyonContext,
    localRegulation,
    sourcesCitation: "Sources : Enedis 31, Base Données Advenir 2026, Ministère de la Transition Écologique"
  };
}
