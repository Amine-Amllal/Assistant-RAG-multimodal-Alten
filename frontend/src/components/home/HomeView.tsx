import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { AppShell } from "../layout/AppShell";
import { ArrowRightIcon, EyeIcon, LinkIcon, FoldersIcon, PlugIcon } from "../ui/icons";
import { DitherCanvas } from "./DitherCanvas";
import "./HomeView.css";

const FEATURES = [
  {
    tone: "red" as const,
    icon: EyeIcon,
    title: "See the figure, not just a caption",
    description:
      "Diagrams, charts, and tables are captioned and indexed right alongside the text, so the assistant can point you straight to the right figure — not just a nearby paragraph.",
  },
  {
    tone: "blue" as const,
    icon: LinkIcon,
    title: "Every answer is sourced",
    description:
      "No guessing where an answer came from. Each response links back to the exact document, page, and excerpt — or shows you the figure itself.",
  },
  {
    tone: "yellow" as const,
    icon: FoldersIcon,
    title: "Your corpus, organized your way",
    description:
      "Group documents however your team works, rename or move them anytime, and duplicate a document across groups without ever storing the file twice.",
  },
  {
    tone: "black" as const,
    icon: PlugIcon,
    title: "Built to plug in anywhere",
    description:
      "Exposed through the Model Context Protocol, so any compatible agent or client can query your document corpus directly — no custom integration required.",
  },
];

export function HomeView() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AppShell>
      <div className="home">
        <section className="home__hero" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="home__hero-card">
            <div className="home__hero-dither">
              <DitherCanvas speed={isHovered ? 0.6 : 0.2} />
            </div>

            <div className="home__hero-content">
              <span className="home__badge">
                <span className="home__badge-dot">
                  <span className="home__badge-dot-ping" />
                  <span className="home__badge-dot-core" />
                </span>
                Multimodal RAG Assistant
              </span>

              <h1 className="home__headline">
                Your documents,
                <br />
                <span className="home__headline-muted">finally answer back.</span>
              </h1>

              <p className="home__lede">
                Ask questions in plain language and get answers grounded in your manuals, specs, and
                research papers — text, tables, and figures alike, each one cited back to its source.
              </p>

              <div className="home__actions">
                <SignedIn>
                  <button className="home__cta" onClick={() => navigate("/chat")}>
                    <span>Start a conversation</span>
                    <ArrowRightIcon className="home__cta-arrow" />
                  </button>
                  <button className="home__secondary-action" onClick={() => navigate("/documents")}>
                    or browse your documents
                  </button>
                </SignedIn>
                <SignedOut>
                  <button className="home__cta" onClick={() => navigate("/sign-up")}>
                    <span>Sign up</span>
                    <ArrowRightIcon className="home__cta-arrow" />
                  </button>
                  <button className="home__secondary-action" onClick={() => navigate("/sign-in")}>
                    or log in
                  </button>
                </SignedOut>
              </div>
            </div>
          </div>
        </section>

        <section className="home__features">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="home-feature-card">
                <span className={`home-feature-card__icon home-feature-card__icon--${feature.tone}`}>
                  <Icon />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
