# Assistant RAG Multimodal — Alten

Assistant de recherche documentaire multimodal (texte + images) développé dans le cadre d'un
stage PFA de 2 mois. Stagiaire : **Amine Amllal**, élève ingénieur IA & Technologies des
Données, ENSAM Meknès.

## Pipeline

```
PDF / Word
    │
    ▼
Docling (parsing + chunking sémantique)
    │                     │
    ▼                     ▼
Chunks texte        Figures extraites
    │                     │
    │               VLM captioning
    │               (Gemma-3 27B via DeepInfra)
    │                     │
    └──────────┬──────────┘
               ▼
     Mistral embeddings (mistral-embed)
               │
               ▼
        Chroma (vector store)
        + BM25 (sparse retrieval)
               │
               ▼
     Hybrid retrieval (dense + BM25, RRF)
               │
               ▼
     Mistral LLM (mistral-small-latest)
               │
               ▼
     Réponse sourcée (texte + figures)
```

## Stack

| Composant | Technologie |
|---|---|
| Backend | FastAPI + Python |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Parsing | Docling |
| Embeddings | `mistral-embed` (Mistral API) |
| VLM captioning | Gemma-3 27B (DeepInfra) |
| Vector store | ChromaDB |
| LLM de génération | `mistral-small-latest` |
| Auth | Clerk |
| Cache conversations | Redis / FakeRedis |

## Benchmark RAGAS

### Méthodologie

Évaluation réalisée avec [RAGAS 0.4.3](https://docs.ragas.io/) sur un corpus de 3 documents
indexés (**BERT.pdf**, **Attention Is All You Need.pdf**, **Circuit Diagram Symbols.pdf**) et
6 questions de référence rédigées manuellement.

**Juge LLM** : `llama-3.3-70b-versatile` (Groq) — modèle indépendant du système évalué pour
éviter le biais auto-évaluatif.

**Embeddings pour `ResponseRelevancy`** : `mistral-embed` — les mêmes embeddings que ceux du
système évalué, pour mesurer la pertinence dans le même espace vectoriel.

| Métrique | Mesure |
|---|---|
| **Faithfulness** | La réponse est-elle fidèle aux passages récupérés (pas d'hallucination) ? |
| **Answer Relevancy** | La réponse répond-elle vraiment à la question ? |
| **Context Precision** | Les passages récupérés sont-ils pertinents (peu de bruit) ? |
| **Context Recall** | Le retrieval a-t-il ramené l'info nécessaire pour répondre ? |

### Résultats (run du 2026-07-02)

| Question | Faithfulness | Answer Relevancy | Context Precision | Context Recall |
|---|:---:|:---:|:---:|:---:|
| Que signifie l'acronyme BERT ? | 1.000 | 0.890 | 0.756 | 1.000 |
| Sur quelles deux tâches BERT est-il pré-entraîné ? | 1.000 | 0.896 | 0.700 | 1.000 |
| Quel pourcentage de tokens est masqué lors du MLM ? | 1.000 | 0.959 | 0.700 | 1.000 |
| Quel token spécial est ajouté au début de chaque séquence ? | 1.000 | 0.987 | 1.000 | 1.000 |
| À quoi sert un schéma de circuit électrique ? | 1.000 | 0.926 | 0.888 | 1.000 |
| Que représente le symbole de mise à la terre (ground) ? | 0.000 | 0.926 | 1.000 | 1.000 |
| **Moyenne** | **0.833** | **0.931** | **0.841** | **1.000** |

### Lecture des résultats

- **Faithfulness = 0.0** sur la question *ground* : la réponse décrivait l'aspect visuel du
  symbole plutôt que sa signification électrique — le contexte récupéré (description d'image OCR)
  ne contenait pas la définition sémantique. Piste : enrichir le prompt système pour distinguer
  « décrire » de « expliquer la signification ».
- **Context Precision < 1.0** sur les questions BERT : le retrieval remonte parfois des chunks
  de *Attention Is All You Need* qui ne sont pas pertinents pour répondre à des questions sur
  BERT. Piste : filtrage par document ou re-ranking.
- **Context Recall = 1.0** partout : les chunks nécessaires à la réponse sont systématiquement
  récupérés. L'indexation hybride dense + BM25 fonctionne bien.

## Démarrage rapide

Voir [HOW_TO_RUN.md](HOW_TO_RUN.md) pour les instructions complètes.
