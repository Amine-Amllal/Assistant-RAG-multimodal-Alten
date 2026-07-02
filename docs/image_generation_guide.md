# Guide de génération des visuels du rapport

Ce fichier recense **10 visuels** référencés dans `docs/rapport/main.tex`. Chaque figure
doit être déposée dans `docs/images/` sous le nom de fichier indiqué. Tant qu'un fichier
est absent, le rapport compile quand même (un cadre placeholder s'affiche à sa place) ;
dès que le fichier est déposé, une recompilation (`pdflatex` ×2) l'intègre.

- **Images standard** → prompt à copier-coller dans un générateur d'images. Tous les
  prompts imposent la palette ALTEN : **fond blanc dominant, accents bleu #1B6FB5,
  rouge #E2231A et jaune/or #FFD400**, texte noir/gris foncé.
- **Diagrammes UML** → code PlantUML complet, à compiler en PNG/SVG
  (`plantuml -tpng fichier.puml` ou https://www.plantuml.com/plantuml). Un thème couleur
  ALTEN est inclus dans chaque bloc.

> Astuce : si vous générez des SVG, convertissez-les en PNG avant inclusion (le rapport
> référence des `.png`), ou adaptez l'extension dans le `.tex`.

---

## 1. `docs/images/rag_principe.png` — Principe général du RAG *(image standard)*

**Prompt :**

> Clean technical illustration of the Retrieval-Augmented Generation (RAG) paradigm, on a
> pure white background, in a flat modern corporate infographic style. Two horizontal
> stages: (1) top row labeled "Indexation (hors ligne)": documents icon → "Découpage en
> chunks" → "Modèle d'embeddings" → a vector database cylinder labeled "Base vectorielle";
> (2) bottom row labeled "Question (en ligne)": a user icon with a speech bubble
> "Question" → "Embedding de la question" → arrow into the same vector database → "Top-k
> passages pertinents" → a large language model chip icon labeled "LLM" → a document-style
> answer card labeled "Réponse sourcée [Source 1] [Source 2]". Use a strict color palette
> inspired by the ALTEN logo: dominant white background, medium blue #1B6FB5 for main
> boxes and arrows, red #E2231A for one or two key highlights (the LLM chip and the final
> answer border), yellow-gold #FFD400 for small accent markers, black/dark-gray text.
> Thin lines, rounded rectangles, subtle shadows, French labels, no photorealism, no dark
> background, 16:9 aspect ratio.

---

## 2. `docs/images/rag_multimodal_approches.png` — Trois approches d'indexation des images *(image standard)*

**Prompt :**

> Flat modern comparison infographic on a pure white background showing three side-by-side
> vertical panels, each describing a strategy to make document images searchable. Panel 1
> titled "OCR seul": an image/diagram icon → an OCR scanner icon → a small text snippet
> icon, caption "Texte visible uniquement". Panel 2 titled "Description par VLM"
> (visually emphasized as the chosen approach, with a red #E2231A "retenu" ribbon or
> border): an image icon → a vision-language model chip icon labeled "VLM" → a paragraph
> icon labeled "Description détaillée" → a vector database cylinder shared with text
> chunks, caption "Index unifié texte + images". Panel 3 titled "Embeddings multimodaux":
> image and text icons both projected into a shared 2D dot-cloud/vector-space
> illustration, caption "Espace commun (CLIP / ColPali)". Strict ALTEN-inspired palette:
> dominant white, medium blue #1B6FB5 for boxes/icons/arrows, red #E2231A only to
> highlight the chosen panel, yellow-gold #FFD400 for small accents, dark-gray text.
> Clean thin-line corporate style, French labels, light theme only, 16:9.

---

## 3. `docs/images/pipeline_global.png` — Pipeline fonctionnel complet *(diagramme PlantUML — activité)*

```plantuml
@startuml pipeline_global
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam ArrowColor #1B6FB5
skinparam ActivityBorderColor #1B6FB5
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityDiamondBorderColor #E2231A
skinparam ActivityDiamondBackgroundColor #FFF9DE
skinparam PartitionBorderColor #1B6FB5
skinparam PartitionFontColor #124E80

|#F4F6F8|Ingestion (asynchrone)|
start
:Téléversement PDF / DOCX / XLSX;
:File d'ingestion (worker unique);
:Analyse structurelle **Docling**
(layout + TableFormer, backend pypdfium2);
fork
  :Découpage sémantique
  **HybridChunker** (512 tokens, contextualisé);
fork again
  :Extraction des figures
  + légendes d'origine;
  :Description par VLM
  **Gemma-3 27B** (DeepInfra);
  :Concaténation légende + description;
end fork
:Vectorisation **mistral-embed**
(1024 dim., normalisation L2, lots de 32);
:Indexation **ChromaDB**
(métadonnées : document, page, type text/image);
:Invalidation de l'index **BM25**;
stop

|#FFFFFF|Restitution (temps réel)|
start
:Question en langage naturel;
if (Périmètre automatique ?) then (oui)
  :Routage LLM vers les groupes pertinents
  (repli conservateur : tout le corpus);
else (non)
  :Documents sélectionnés manuellement;
endif
:Embedding de la question (mistral-embed);
fork
  :Recherche dense (ChromaDB);
fork again
  :Recherche lexicale (BM25);
end fork
:Fusion **RRF** (k = 60), top-5 chunks;
:Génération contrainte **mistral-small-latest**
(citations [Source N] obligatoires);
:Réponse sourcée
(extraits + figures affichées);
stop
@enduml
```

---

## 4. `docs/images/architecture_globale.png` — Architecture globale *(image standard)*

**Prompt :**

> Professional software architecture diagram, flat corporate style, pure white
> background. Three horizontal tiers connected by thin blue arrows. Top tier "Frontend —
> React 18 + TypeScript (Vite)": browser window icon containing three module cards
> "Documents", "Chat", "Auth (Clerk)". Middle tier "Backend — FastAPI (Python)": a large
> rounded rectangle containing cards "API REST (/api/documents, /api/groups, /api/chat)",
> "File d'ingestion (worker unique)", "Recherche hybride (dense + BM25 + RRF)",
> "Fichiers statiques /static/images". Bottom tier "Persistance": cylinders "SQLite",
> "ChromaDB", a folder icon "Fichiers (uploads, markdown, images)", and a small cache
> icon "Redis / FakeRedis". On the right side, a vertical column of external cloud
> services connected to the backend with dashed blue lines: "Mistral AI (embeddings +
> LLM)", "HF Inference / DeepInfra (VLM Gemma-3 27B)", "Clerk (JWKS)", "Groq (juge
> RAGAS)". Strict ALTEN-inspired palette: dominant white, medium blue #1B6FB5 for
> borders/arrows/headers, red #E2231A sparingly for the backend tier title bar, yellow-gold
> #FFD400 for small accent chips, dark-gray text. Clean thin lines, rounded corners,
> French labels, light theme only, 16:10.

---

## 5. `docs/images/uml_paquetages_backend.png` — Paquetages du backend *(diagramme PlantUML — composants/paquetages)*

```plantuml
@startuml uml_paquetages_backend
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam packageBorderColor #1B6FB5
skinparam packageFontColor #124E80
skinparam componentBorderColor #1B6FB5
skinparam componentBackgroundColor #FFFFFF
skinparam ArrowColor #1B6FB5
skinparam noteBackgroundColor #FFF9DE
skinparam noteBorderColor #FFD400

package "app.api" {
  [routes_documents]
  [routes_groups]
  [routes_chat]
}

package "app.services" {
  [ingestion_queue]
  [ingestion]
  [docling_parser]
  [hf_client]
  [mistral_client]
  [vector_store]
  [clerk_auth]
  [cache]
  [documents_repo]
  [groups_repo]
  [conversations_repo]
}

package "app.storage" {
  [paths]
}

[config] as CFG #FFF9DE

[routes_documents] --> [ingestion_queue]
[routes_documents] --> [documents_repo]
[routes_documents] --> [vector_store]
[routes_groups] --> [groups_repo]
[routes_chat] --> [clerk_auth]
[routes_chat] --> [conversations_repo]
[routes_chat] --> [hf_client]
[routes_chat] --> [mistral_client]
[routes_chat] --> [vector_store]
[ingestion_queue] --> [ingestion]
[ingestion] --> [docling_parser]
[ingestion] --> [hf_client]
[ingestion] --> [vector_store]
[ingestion] --> [documents_repo]
[hf_client] ..> [mistral_client] : EMBEDDING_BACKEND=mistral
[conversations_repo] --> [cache]
[documents_repo] --> [paths]
[vector_store] --> [paths]

note bottom of [vector_store]
  ChromaDB (dense) + BM25 (lexical)
  fusion RRF
end note
@enduml
```

---

## 6. `docs/images/uml_sequence_ingestion.png` — Séquence d'ingestion *(diagramme PlantUML — séquence)*

```plantuml
@startuml uml_sequence_ingestion
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam sequenceArrowColor #1B6FB5
skinparam sequenceLifeLineBorderColor #1B6FB5
skinparam sequenceParticipantBorderColor #1B6FB5
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam actorBorderColor #E2231A
skinparam noteBackgroundColor #FFF9DE
skinparam noteBorderColor #FFD400

actor Utilisateur as U
participant "Frontend\nReact" as F
participant "API FastAPI\n(routes_documents)" as A
participant "File d'ingestion\n(worker unique)" as Q
participant "Docling" as D
participant "VLM Gemma-3\n(DeepInfra)" as V
participant "mistral-embed" as E
database "ChromaDB\n+ SQLite" as S

U -> F : dépose un PDF
F -> A : POST /api/documents/upload
A -> S : insère le document (statut « processing »)
A -> Q : enqueue(document)
A --> F : 200 — document créé
note right of F #FFF9DE
  L'interface interroge périodiquement
  GET /api/documents pour suivre
  l'étape d'ingestion en cours
end note

Q -> D : parse_document()
D --> Q : structure + figures + légendes
Q -> S : export Markdown, nb de pages
Q -> D : HybridChunker (512 tokens)
D --> Q : chunks contextualisés
loop pour chaque figure
  Q -> V : caption_image(image, contexte)
  V --> Q : description détaillée
end
Q -> E : embed_texts(chunks + descriptions)
E --> Q : vecteurs 1024 dim. (normalisés L2)
Q -> S : upsert text/image chunks + métadonnées
Q -> S : statut = « indexed »
@enduml
```

---

## 7. `docs/images/uml_sequence_chat.png` — Séquence question–réponse *(diagramme PlantUML — séquence)*

```plantuml
@startuml uml_sequence_chat
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam sequenceArrowColor #1B6FB5
skinparam sequenceLifeLineBorderColor #1B6FB5
skinparam sequenceParticipantBorderColor #1B6FB5
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam actorBorderColor #E2231A
skinparam noteBackgroundColor #FFF9DE
skinparam noteBorderColor #FFD400

actor Utilisateur as U
participant "Frontend\nReact" as F
participant "API FastAPI\n(routes_chat)" as A
participant "Clerk\n(JWKS)" as C
participant "Mistral LLM" as M
participant "mistral-embed" as E
participant "vector_store\n(Chroma + BM25)" as V

U -> F : pose une question
F -> A : POST /api/chat (jeton Bearer)
A -> C : vérification JWT RS256 (clés en cache)
C --> A : user_id
alt périmètre automatique
  A -> M : routage : groupes pertinents ? (température 0)
  M --> A : {"groups": [...]} (repli : tous)
end
A -> E : embedding de la question
E --> A : vecteur 1024 dim.
par recherche hybride
  A -> V : recherche dense (top 15)
  A -> V : recherche BM25 (top 15)
end
V --> A : fusion RRF → top 5 chunks
A -> M : prompt contraint (sources numérotées)
M --> A : réponse avec citations [Source N]
A --> F : réponse + sources typées (texte / figure)
F -> U : réponse, extraits cités,\nfigures affichées sous la réponse
@enduml
```

---

## 8. `docs/images/uml_cas_utilisation.png` — Cas d'utilisation *(diagramme PlantUML — cas d'utilisation)*

```plantuml
@startuml uml_cas_utilisation
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam usecaseBorderColor #1B6FB5
skinparam usecaseBackgroundColor #FFFFFF
skinparam actorBorderColor #E2231A
skinparam ArrowColor #1B6FB5
skinparam rectangleBorderColor #1B6FB5

left to right direction
actor "Utilisateur\nauthentifié" as U
actor "Services d'IA externes\n(Mistral, DeepInfra)" as IA

rectangle "Assistant RAG Multimodal" {
  usecase "S'inscrire / se connecter\n(Clerk)" as UC0
  usecase "Téléverser des documents\n(PDF, Word, Excel)" as UC1
  usecase "Suivre l'état d'ingestion" as UC2
  usecase "Consulter un document\n(Markdown + galerie de figures)" as UC3
  usecase "Gérer les groupes\ndocumentaires" as UC4
  usecase "Gérer les documents\n(renommer, dupliquer, supprimer)" as UC5
  usecase "Poser une question\nen langage naturel" as UC6
  usecase "Choisir le périmètre\n(manuel / automatique)" as UC7
  usecase "Consulter les réponses sourcées\n(extraits + figures)" as UC8
  usecase "Gérer ses conversations" as UC9
}

U --> UC0
U --> UC1
U --> UC2
U --> UC3
U --> UC4
U --> UC5
U --> UC6
U --> UC9
UC6 ..> UC7 : <<include>>
UC6 ..> UC8 : <<include>>
UC1 ..> UC2 : <<include>>
UC6 --> IA
UC1 --> IA
@enduml
```

---

## 9. `docs/images/uml_modele_donnees.png` — Modèle de données *(diagramme PlantUML — classes)*

```plantuml
@startuml uml_modele_donnees
!theme plain
skinparam backgroundColor white
skinparam defaultFontName Helvetica
skinparam classBorderColor #1B6FB5
skinparam classBackgroundColor #FFFFFF
skinparam classHeaderBackgroundColor #EAF2F9
skinparam ArrowColor #1B6FB5
skinparam noteBackgroundColor #FFF9DE
skinparam noteBorderColor #FFD400
skinparam packageBorderColor #E2231A

package "SQLite (métadonnées)" {
  class documents {
    id : TEXT <<PK, UUID>>
    name : TEXT
    category : TEXT
    pages : INTEGER
    size_mb : REAL
    status : processing | indexed | error
    processing_step : TEXT
    error_message : TEXT
    file_path : TEXT
    source_document_id : TEXT <<duplicata>>
    uploaded_at : TEXT
  }
  class groups {
    id : TEXT <<PK, UUID>>
    name : TEXT <<UNIQUE>>
  }
  class conversations {
    id : TEXT <<PK>>
    user_id : TEXT <<Clerk>>
    title : TEXT
    created_at / updated_at : TEXT
  }
  class messages {
    id : TEXT <<PK>>
    conversation_id : TEXT <<FK>>
    role : user | assistant
    content : TEXT
    sources_json : TEXT
    created_at : TEXT
  }
}

package "ChromaDB (index vectoriel unifié)" {
  class chunk {
    id : TEXT
    embedding : vecteur 1024 dim.
    document : texte du chunk / description figure
    --métadonnées--
    document_id : TEXT
    document_name : TEXT
    page : INTEGER
    chunk_type : text | image
    image_path : TEXT
  }
}

package "Fichiers" {
  class stockage <<folder>> {
    uploads/<id>_<nom>
    markdown/<id>.md
    images/<id>/picture_N.png
  }
}

groups "1" <-- "N" documents : category
conversations "1" *-- "N" messages
documents "1" <.. "N" chunk : document_id
documents "1" <.. "1" stockage : id
documents "0..1" <-- "N" documents : source_document_id

note bottom of chunk
  Le champ chunk_type matérialise
  l'indexation **multimodale unifiée** :
  texte et figures dans le même espace
end note
@enduml
```

---

## 10. `docs/images/ragas_radar.png` — Synthèse RAGAS *(image standard)*

**Prompt :**

> Minimal clean data visualization on a pure white background: a radar/spider chart with
> exactly four axes labeled in French "Faithfulness (0,83)", "Answer Relevancy (0,93)",
> "Context Precision (0,84)", "Context Recall (1,00)", scale from 0 to 1 with light gray
> grid rings at 0.25/0.5/0.75/1.0. The data polygon is filled with a translucent medium
> blue #1B6FB5 (about 25% opacity) with a solid blue outline and small red #E2231A dots
> at each vertex; one small yellow-gold #FFD400 badge near the "Context Recall" vertex
> highlighting the perfect score "1,00". Title above the chart in dark gray: "Évaluation
> RAGAS — moyennes sur 6 questions". Flat corporate infographic style inspired by the
> ALTEN color palette (white dominant, blue/red/gold accents), no dark background, no 3D,
> square aspect ratio.

*(Alternative : ce graphe peut aussi être tracé précisément avec matplotlib à partir des
moyennes du tableau RAGAS du chapitre 3.)*

---

## 11–12. Captures d'écran de l'application *(recommandé : vraies captures)*

Pour `docs/images/ui_chat.png` et `docs/images/ui_documents.png`, le mieux est une **vraie
capture d'écran** de l'application en thème clair (lancer l'app, cf. `HOW_TO_RUN.md`).
À défaut, prompts de génération :

**`ui_chat.png` :**

> High-fidelity UI mockup of a modern document-assistant chat interface, light theme,
> white background. Left sidebar with a conversations list. Main area: a user question
> bubble "Montre-moi l'architecture du Transformer", followed by an assistant answer card
> in clean typography citing sources inline as "[Source 1]" chips, below it a row of
> source cards (document name "Attention Is All You Need.pdf", page number) and a
> displayed technical figure of a neural network architecture diagram. Bottom: a rounded
> message input with a document-scope selector chip "Périmètre : automatique". Accent
> colors from the ALTEN palette: medium blue #1B6FB5 for primary buttons and links, a
> touch of red #E2231A on the send button, yellow-gold #FFD400 on one small badge; white
> dominant, dark-gray text, subtle gray borders, French interface labels, 16:10.

**`ui_documents.png` :**

> High-fidelity UI mockup of a document-management view in a modern web app, light theme,
> white background. Header "Documents" with an upload dropzone ("Glissez vos PDF, Word,
> Excel ici"). A grid of document cards, each with a file icon, title (e.g. "BERT.pdf",
> "Circuit Diagram Symbols.pdf"), a group badge ("Research Paper", "Technical Manual"),
> page count, and a status chip: most green "Indexé", one blue animated "Décrit la figure
> 3/5...", one red "Erreur". A left sidebar lists document groups with counts. Accent
> colors from the ALTEN palette: medium blue #1B6FB5 for primary elements, red #E2231A
> only on the error chip, yellow-gold #FFD400 on one highlight badge; dominant white,
> dark-gray text, subtle shadows, French labels, 16:10.

---

## Récapitulatif des fichiers attendus dans `docs/images/`

| # | Fichier | Type | Source |
|---|---------|------|--------|
| 1 | `rag_principe.png` | Image | Prompt §1 |
| 2 | `rag_multimodal_approches.png` | Image | Prompt §2 |
| 3 | `pipeline_global.png` | UML (activité) | PlantUML §3 |
| 4 | `architecture_globale.png` | Image | Prompt §4 |
| 5 | `uml_paquetages_backend.png` | UML (paquetages) | PlantUML §5 |
| 6 | `uml_sequence_ingestion.png` | UML (séquence) | PlantUML §6 |
| 7 | `uml_sequence_chat.png` | UML (séquence) | PlantUML §7 |
| 8 | `uml_cas_utilisation.png` | UML (cas d'utilisation) | PlantUML §8 |
| 9 | `uml_modele_donnees.png` | UML (classes) | PlantUML §9 |
| 10 | `ragas_radar.png` | Image (graphique) | Prompt §10 |
| 11 | `ui_chat.png` | Capture d'écran (ou prompt §11) | App réelle |
| 12 | `ui_documents.png` | Capture d'écran (ou prompt §12) | App réelle |

Déjà présents : `alten.png` et `ensam.png` (logos, page de garde).
