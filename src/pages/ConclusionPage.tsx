import { memo } from "react";
import PageSection from "../components/PageSection";
import "./ConclusionPage.css";

const ROWS = [
  {
    concept: "Paramètres",
    micro: "4 192",
    real: "des centaines de milliards",
    analogy:
      "C'est comme comparer un carnet de notes à toutes les bibliothèques du monde.",
  },
  {
    concept: "Vocabulaire",
    micro: "27 lettres (a-z + BOS)",
    real: "50 000+ sous-mots (BPE)",
    analogy:
      "On épelle lettre par lettre ; les vrais LLM lisent des mots entiers d'un coup.",
  },
  {
    concept: "Couches",
    micro: "1 seule",
    real: "96 et plus",
    analogy: "Un étage vs un gratte-ciel de 96 étages.",
  },
  {
    concept: "Têtes d'attention",
    micro: "4",
    real: "96 et plus",
    analogy:
      "4 paires d'yeux vs une centaine qui regardent partout en même temps.",
  },
  {
    concept: "Contexte",
    micro: "8 positions",
    real: "128 000+ tokens",
    analogy: "On retient 8 lettres ; GPT retient un livre entier.",
  },
  {
    concept: "Normalisation",
    micro: "aucune",
    real: "LayerNorm, dropout, scheduling",
    analogy:
      "Des garde-fous qui empêchent le modèle de dérailler pendant l'entraînement.",
  },
  {
    concept: "Alignement",
    micro: "aucun",
    real: "RLHF / instruction tuning",
    analogy:
      "Les vrais LLM apprennent aussi à être polis, utiles et à refuser les demandes dangereuses.",
  },
  {
    concept: "Infrastructure",
    micro: "ton navigateur",
    real: "clusters de GPU, des mois",
    analogy: "Un vélo vs une fusée — même principe, autre échelle.",
  },
];

const ConclusionPage = memo(function ConclusionPage() {
  return (
    <PageSection id="conclusion" title="8. Conclusion">
      <p className="page-desc">
        Tu as compris les <strong>fondations</strong> : tokenisation,
        plongements, propagation, attention, entraînement et inférence. Les
        vrais LLM comme GPT-5 font exactement la même chose — voici ce que les
        ingénieurs ajoutent par-dessus.
      </p>

      <div className="panel">
        <div className="panel-title">Notre microGPT vs les vrais LLM</div>
        <table className="conclusion-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Notre microGPT</th>
              <th>Les vrais LLM</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.concept}>
                <td className="conclusion-concept">{r.concept}</td>
                <td>{r.micro}</td>
                <td>{r.real}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="conclusion-analogies">
          {ROWS.map((r) => (
            <p key={r.concept} className="conclusion-analogy">
              <strong>{r.concept}</strong> — <em>{r.analogy}</em>
            </p>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Aller plus loin</div>
        <ul className="conclusion-links">
          <li>
            <a
              href="https://karpathy.github.io/2026/02/12/microgpt/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guide officiel MicroGPT
            </a>{" "}
            — le tutoriel complet d'Andrej Karpathy (en anglais, pour les plus
            motivés)
          </li>
          <li>
            <a
              href="https://microgpt-ts-fr.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              microgpt-ts-fr
            </a>{" "}
            — le code TypeScript de référence pour aller plus loin
          </li>
          <li>
            <a
              href="https://microgpt-lab.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              microgpt-lab
            </a>{" "}
            — laboratoire interactif pour expérimenter
          </li>
          <li>
            <span>tuto-llm</span> — cours pédagogique associé en français
            (prochainement)
          </li>
        </ul>

        <p className="page-desc" style={{ marginTop: "var(--sp-12)" }}>
          Envie de voir l'interface autrement&nbsp;? Essaie ces démos
          alternatives&nbsp;:
        </p>
        <div className="playground-links">
          <a
            href="/playground-digital-explorer.html"
            target="_blank"
            rel="noopener noreferrer"
            className="playground-card"
          >
            <span className="playground-card__icon">🚀</span>
            <span className="playground-card__label">Digital Explorer</span>
          </a>
          <a
            href="/playground-borne-arcade.html"
            target="_blank"
            rel="noopener noreferrer"
            className="playground-card"
          >
            <span className="playground-card__icon">🕹️</span>
            <span className="playground-card__label">Borne d'Arcade</span>
          </a>
          <a
            href="/playground-tableau-noir.html"
            target="_blank"
            rel="noopener noreferrer"
            className="playground-card"
          >
            <span className="playground-card__icon">🖍️</span>
            <span className="playground-card__label">Tableau Noir</span>
          </a>
        </div>
      </div>
    </PageSection>
  );
});

export default ConclusionPage;
