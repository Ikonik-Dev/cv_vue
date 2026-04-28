// src/data/cv.js — SOURCE UNIQUE DE VÉRITÉ (SSOT) des données du CV
// ──────────────────────────────────────────────────────────────────
// Toutes les informations du CV sont centralisées ici.
// Modifier ce fichier suffit pour mettre à jour tout le rendu.
// Les composants importent uniquement ce dont ils ont besoin.

// ─── Informations personnelles ───────────────────────────────────
export const person = {
  firstName: "SullyVan",
  lastName: "DUPONT",
  initials: "DSV",
  title: "Senior PHP / Symfony Developer",
  tagline: "10 ans d'expérience · Backend Expert · Open Source Contributor",
  location: "Paris, France (IDF)",
  availability: "Immédiate — Freelance / CDI",
  tjm: "650 – 750 € / jour",
  remote: "Full remote OK",
  email: "sullyvan@dupont.dev",
  label: "[ DISPONIBLE — PARIS, FRANCE — FULL REMOTE ]",
  bio: [
    "Développeur PHP / Symfony Senior basé à Paris. Je conçois des architectures back-end solides, des API REST performantes et des applications métier complexes depuis <strong>2014</strong>. Passionné par les bonnes pratiques DDD, TDD et l'automatisation DevOps.",
    "Expert en montée en charge, refactoring de legacy et formation d'équipes. Contributeur actif à plusieurs bundles Symfony open source.",
  ],
};

// ─── Statistiques affichées dans le hero ─────────────────────────
export const stats = [
  { num: "10+", label: "ans XP" },
  { num: "50+", label: "projets" },
  { num: "12", label: "clients" },
  { num: "8k+", label: "commits" },
];

// ─── Compétences (4 catégories) ──────────────────────────────────
// variant : contrôle la couleur du tag dans SkillsSection.vue
//   'primary'  → --color-accent-1 (cyan)
//   'accent2'  → --color-accent-2 (hot pink)
//   'accent3'  → --color-accent-3 (lime)
//   ''         → couleur par défaut (--color-fg)
export const skills = [
  {
    category: "Back-end",
    variant: "primary",
    items: [
      "PHP 8.x",
      "Symfony 7",
      "API Platform",
      "Laravel",
      "REST / GraphQL",
      "PHPUnit",
    ],
  },
  {
    category: "Data",
    variant: "accent2",
    items: [
      "MySQL / MariaDB",
      "PostgreSQL",
      "Redis",
      "Elasticsearch",
      "Doctrine ORM",
    ],
  },
  {
    category: "DevOps / Tools",
    variant: "accent3",
    items: [
      "Docker",
      "Kubernetes",
      "CI/CD GitLab",
      "GitHub Actions",
      "Linux / Bash",
      "Nginx / Apache",
    ],
  },
  {
    category: "Front-end",
    variant: "",
    items: ["Vue.js 3", "TypeScript", "Tailwind CSS", "Webpack / Vite"],
  },
];

// ─── Expériences professionnelles ────────────────────────────────
// stack : tableau de tags affichés en bas de chaque carte
export const experiences = [
  {
    period: "2021 — 2026",
    company: "NEXACORE SAS · Paris",
    role: "Lead Developer PHP / Symfony",
    tasks: [
      "Architecture micro-services Symfony 6/7 (12 services, >2M req/jour)",
      "Migration legacy PHP 5.6 → PHP 8.3 + Symfony 7 (−60% temps de réponse)",
      "Mise en place CI/CD GitLab + déploiement Kubernetes GKE",
      "Encadrement d'une équipe de 5 développeurs back-end",
      "Conception API REST + API Platform consommées par 3 apps mobiles",
    ],
    stack: ["PHP 8.3", "Symfony 7", "Docker", "K8s", "Redis", "PostgreSQL"],
  },
  {
    period: "2017 — 2021",
    company: "AGENCEWEB360 · Lyon (remote)",
    role: "Développeur Symfony Senior",
    tasks: [
      "Développement plateforme SaaS e-commerce (Symfony 4/5, >500 clients)",
      "Intégration passerelles de paiement Stripe & PayPlug",
      "Design & implémentation d'une API GraphQL (API Platform + Mercure)",
      "Tests unitaires et fonctionnels PHPUnit / Behat (couverture >85%)",
    ],
    stack: ["Symfony 5", "GraphQL", "Stripe", "Behat", "MySQL"],
  },
  {
    period: "2014 — 2017",
    company: "DIGITLAB · Paris",
    role: "Développeur PHP / Symfony Junior → Confirmé",
    tasks: [
      "Développement applications métier (CRM, ERP interne) sous Symfony 2/3",
      "Intégration maquettes Figma en HTML / CSS / JS vanilla",
      "Maintenance et évolution d'un parc de 20+ sites",
    ],
    stack: ["Symfony 3", "PHP 7", "jQuery", "MySQL"],
  },
];

// ─── Projets ─────────────────────────────────────────────────────
export const projects = [
  {
    num: "01",
    title: "SymfoBundle Audit",
    desc: "Bundle Symfony open source d'audit automatique de sécurité des routes et des entités. 1,2k stars GitHub, 40k téléchargements Packagist.",
    stack: ["PHP 8", "Symfony", "Open Source"],
    link: "#",
    label: "→ GitHub",
  },
  {
    num: "02",
    title: "DataPulse SaaS",
    desc: "Plateforme analytics temps réel pour PME : ingest Kafka, stockage Elasticsearch, dashboard Vue.js 3. 250 clients actifs.",
    stack: ["Symfony 7", "Kafka", "Elasticsearch", "Vue.js 3"],
    link: "#",
    label: "→ Case Study",
  },
  {
    num: "03",
    title: "FleetTrack API",
    desc: "API REST de gestion de flotte véhicules : géolocalisation temps réel, alertes Redis Pub/Sub, 99,98% uptime sur 18 mois.",
    stack: ["API Platform", "Redis", "PostgreSQL", "Docker"],
    link: "#",
    label: "→ Case Study",
  },
];

// ─── Formation ───────────────────────────────────────────────────
export const education = [
  {
    year: "2014",
    title: "Master Informatique",
    school: "Université Paris-Saclay · Mention Bien",
    detail: "Spécialité Génie Logiciel & Architecture des Systèmes",
  },
  {
    year: "2022",
    title: "Symfony Certification",
    school: "SensioLabs — Advanced Level",
    detail: "Score : 88% — Top 5% des certifiés FR",
  },
  {
    year: "2023",
    title: "AWS Solutions Architect",
    school: "Amazon Web Services — Associate",
    detail: "Cloud architecture, scalabilité, sécurité AWS",
  },
  {
    year: "2024",
    title: "Certified Kubernetes Admin",
    school: "CNCF / Linux Foundation",
    detail: "Déploiement, scaling, networking K8s",
  },
];

// ─── Liens de navigation ─────────────────────────────────────────
// href : correspond aux IDs des sections dans HomeView.vue
export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "XP", href: "#experience" },
  { label: "Projets", href: "#projects" },
  { label: "Formation", href: "#education" },
  { label: "Contact", href: "#contact" },
];
