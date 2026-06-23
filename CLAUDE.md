# CLAUDE.md

## Projet

Assistant RAG multimodal (texte + images), dans le cadre d'un
stage PFA de 2 mois (8 semaines). Stagiaire : Amine Amllal, élève ingénieur IA & Technologies
des Données, ENSAM Meknès. Le cahier des charges complet est dans
`docs/` (ou fourni en contexte) — s'y référer pour le détail des objectifs, du périmètre et du
planning.

### Objectif principal
Interroger un corpus de documents techniques (PDF, Word) en langage naturel et restituer des
réponses sourcées (extraits texte + images pertinentes), avec les capacités exposées via :
- une API REST (FastAPI),
- une interface de démonstration (React + Tailwind CSS).

### Pipeline fonctionnel attendu
1. Ingestion documents (PDF/Word) -> chunking sémantique -> indexation vectorielle.
2. Extraction des images -> OCR sur celles contenant du texte (Tesseract ou Azure Document
   Intelligence).
3. Description des images via un VLM (GPT-4o vision, LLaVA ou BLIP) pour les rendre
   interrogeables.
4. Indexation unifiée : chunks de texte + texte OCR + descriptions d'images dans une même
   base vectorielle (Chroma ou Qdrant).
5. Retrieval + génération (LangChain, LLM type GPT-4o ou open-source) avec citation des
   sources et affichage de l'image pertinente.
6. Évaluation de la qualité des réponses (RAGAS ou métriques personnalisées : faithfulness,
   pertinence).

### Hors périmètre (explicitement exclu)
Architecture multi-agent complexe, auto-correction avancée (self/corrective RAG),
authentification et gestion fine des droits, mise en production à grande échelle. Ne pas
proposer ces axes comme solutions par défaut — ce sont des perspectives d'extension, pas des
livrables.

### Structure du repo
- `backend/` — backend Python (ingestion, RAG, API FastAPI). Squelette minimal
  pour l'instant (`.env.example`, `.gitignore`).
- `frontend/` — interface React + Vite + TypeScript (Tailwind à confirmer/ajouter).
- `docs/` — rapport de stage (LaTeX, `docs/rapport/`) et corpus de test
  (`docs/test_corpus/`, papers de recherche + manuels techniques).
- `notebooks/` — expérimentations (parsing Docling, captioning d'images via VLM).

## Déploiement cible

L'application sera déployée en fin de stage sur **Oracle Cloud Infrastructure (OCI)**.
Privilégier, à choix technique équivalent, les options compatibles/natives OCI (ex: Oracle
Autonomous Database via le tier Always Free, conteneurs sur une VM OCI) plutôt que des
solutions qui supposeraient un autre cloud ou une infra non portable facilement vers OCI.

## Contraintes d'environnement — IMPORTANT

Je travaille sur un **réseau corporate** et sur un **PC professionnel verrouillé/protégé**.

- Je ne peux **pas installer d'applications, de runtimes ou d'outils système** (ex: nouveau
  interpréteur Python, Docker, Tesseract via installeur, etc.) sans validation préalable de
  l'IT/administrateur. Toute installation de ce type doit être validée par un ticket/demande
  IT avant d'être considérée comme faisable.
- Avant de proposer une commande d'installation système (winget, choco, msi, exe, ajout au
  PATH système, service Windows, etc.), **demander confirmation** que l'IT a validé, ou
  proposer une alternative qui ne nécessite pas de droits admin (ex: installation dans un
  environnement virtuel Python utilisateur, packages npm/pip en scope utilisateur, binaire
  portable sans installeur).
- Le réseau corporate peut bloquer certains accès sortants (proxy, ports, domaines non
  whitelistés). Si une commande réseau échoue de façon suspecte (timeout, refus de connexion),
  envisager un blocage réseau/proxy avant de chercher un bug applicatif.
- Privilégier les dépendances installables sans droits admin : `pip install --user`,
  environnements virtuels (`venv`), packages npm locaux au projet. Éviter de recommander des
  solutions qui supposent des droits administrateur sur la machine.
- Pour l'OCR (Tesseract) ou d'autres outils nécessitant une installation système, vérifier
  d'abord si une alternative pip-only (ex: bindings Python embarquant le binaire, ou un
  service cloud comme Azure Document Intelligence) permet d'éviter l'installation système.
- **Proxy Zscaler (agent applicatif, pas seulement réseau)** : ce PC a Zscaler installé en tant
  qu'application/agent (Zscaler Client Connector), pas comme simple proxy réseau. Cela intercepte
  tout le trafic HTTPS sortant **quel que soit le réseau utilisé** (Wi-Fi corporate, hotspot
  mobile, réseau personnel) tant que l'agent tourne sur la machine. Désactiver l'agent nécessite
  un mot de passe que je n'ai pas (stagiaire, pas de droits IT) — donc changer de réseau ne
  contourne PAS ce blocage. Si un accès réseau échoue, il faut chercher une alternative qui
  fonctionne malgré Zscaler (cache local, source alternative, ticket IT), pas supposer qu'un
  autre réseau réglera le problème.
- **Erreurs SSL `CERTIFICATE_VERIFY_FAILED` côté Python** : Zscaler fait de l'inspection TLS
  (il re-signe le trafic HTTPS avec son propre certificat racine). Windows fait confiance à ce
  certificat (ALTEN Group Root CA + Zscaler Root CA sont dans le magasin de certificats Windows),
  mais la liste de certificats embarquée dans `certifi`/Python ne lui fait pas confiance par
  défaut, d'où des erreurs SSL côté Python alors que le navigateur fonctionne normalement.
  Solution : le package `truststore` (`pip install truststore`), qui fait utiliser à Python le
  magasin de certificats du système (Windows) au lieu de la liste `certifi` embarquée. Suffit
  d'appeler `truststore.inject_into_ssl()` une fois au démarrage de l'application (avant tout
  appel réseau) — voir `backend/app/__init__.py`.
