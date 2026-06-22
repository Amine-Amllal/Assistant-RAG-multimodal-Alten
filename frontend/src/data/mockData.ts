import type { ChatMessage, DocumentItem } from "../types";

export const mockDocuments: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Attention Is All You Need.pdf",
    category: "Research Paper",
    pages: 15,
    sizeMb: 2.1,
    status: "indexed",
    uploadedAt: "2026-06-18",
    thumbnailColor: "red",
  },
  {
    id: "doc-2",
    name: "Industrial Robot Arm — Maintenance Guide.pdf",
    category: "Technical Manual",
    pages: 84,
    sizeMb: 11.4,
    status: "indexed",
    uploadedAt: "2026-06-17",
    thumbnailColor: "blue",
  },
  {
    id: "doc-3",
    name: "Turbine Engineering Specification.pdf",
    category: "Engineering Guide",
    pages: 132,
    sizeMb: 18.7,
    status: "processing",
    uploadedAt: "2026-06-20",
    thumbnailColor: "black",
  },
  {
    id: "doc-4",
    name: "Vision-Language Models Survey.pdf",
    category: "Research Paper",
    pages: 41,
    sizeMb: 5.3,
    status: "indexed",
    uploadedAt: "2026-06-15",
    thumbnailColor: "yellow",
  },
  {
    id: "doc-5",
    name: "Hydraulic Press Safety Manual.pdf",
    category: "Technical Manual",
    pages: 57,
    sizeMb: 7.9,
    status: "error",
    uploadedAt: "2026-06-21",
    thumbnailColor: "red",
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: "m-1",
    role: "user",
    content: "How does multi-head attention work, and is there a diagram for it?",
    createdAt: "2026-06-22T09:12:00Z",
  },
  {
    id: "m-2",
    role: "assistant",
    content:
      "Multi-head attention runs several scaled dot-product attention operations in parallel, each on a learned linear projection of queries, keys, and values. The outputs are concatenated and projected once more, letting the model attend to information from different representation subspaces at once.",
    createdAt: "2026-06-22T09:12:04Z",
    sources: [
      {
        id: "s-1",
        kind: "text",
        documentName: "Attention Is All You Need.pdf",
        page: 4,
        excerpt:
          "Instead of performing a single attention function with dmodel-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values h times...",
        score: 0.93,
      },
      {
        id: "s-2",
        kind: "image",
        documentName: "Attention Is All You Need.pdf",
        page: 4,
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The-Transformer-model-architecture.png/600px-The-Transformer-model-architecture.png",
        caption: "Figure 2: Multi-Head Attention consists of several attention layers running in parallel.",
        score: 0.89,
      },
    ],
  },
];
