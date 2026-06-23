import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { AppShell } from "../layout/AppShell";
import { Button } from "../ui/Button";
import "./HomeView.css";

const FEATURES = [
  {
    tone: "red" as const,
    title: "Multimodal retrieval",
    description:
      "Search across text, tables, and figures in the same pass — answers can cite a diagram as readily as a paragraph.",
  },
  {
    tone: "blue" as const,
    title: "Grounded answers",
    description:
      "Every response is traced back to the exact document, page, and excerpt it was built from. No unsourced claims.",
  },
  {
    tone: "black" as const,
    title: "Exposed via MCP",
    description:
      "The assistant is served through the Model Context Protocol, so any compatible client or agent can query the corpus.",
  },
];

export function HomeView() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="home">
        <section className="home__hero">
          <span className="home__stripe" aria-hidden="true" />
          <div className="home__hero-content">
            <h1>Assistant RAG Multimodal</h1>
            <p className="home__lede">
              Interrogate technical manuals, engineering specs, and research papers — text and images alike —
              and get answers grounded in your own document corpus.
            </p>
            <div className="home__actions">
              <SignedIn>
                <Button variant="primary" onClick={() => navigate("/chat")}>
                  Start a conversation
                </Button>
                <Button variant="secondary" onClick={() => navigate("/documents")}>
                  Browse documents
                </Button>
              </SignedIn>
              <SignedOut>
                <Button variant="primary" onClick={() => navigate("/sign-in")}>
                  Log in
                </Button>
                <Button variant="secondary" onClick={() => navigate("/sign-up")}>
                  Sign up
                </Button>
              </SignedOut>
            </div>
          </div>
        </section>

        <section className="home__features">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="home-feature-card">
              <span className={`home-feature-card__dot home-feature-card__dot--${feature.tone}`} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
