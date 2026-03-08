import { memo } from "react";
import PageSection from "../components/PageSection";
import "./HomePage.css";

interface Props {
  onStart: () => void;
}

const STEPS = [
  { num: 1, label: "Tokenisation", desc: "Découper le texte en lettres" },
  { num: 2, label: "Plongements", desc: "Transformer les lettres en vecteurs" },
  { num: 3, label: "Propagation", desc: "Faire circuler l'information" },
  { num: 4, label: "Attention", desc: "Décider quoi regarder" },
  { num: 5, label: "Entraînement", desc: "Apprendre de ses erreurs" },
  { num: 6, label: "Inférence", desc: "Inventer de nouveaux noms" },
  { num: 7, label: "Modèle complet", desc: "Voir toute la machine assemblée" },
  { num: 8, label: "Conclusion", desc: "Comparer avec les vrais GPT" },
];

const HomePage = memo(function HomePage({ onStart }: Props) {
  return (
    <PageSection id="home" title="Bienvenue">
      <div className="home-hero">
        <p className="home-pitch">
          Tu vas construire un <strong>cerveau artificiel</strong> qui invente
          des prénoms. Étape par étape, tu vas comprendre comment fonctionnent
          les modèles comme GPT.
        </p>

        <div className="home-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="home-step">
              <span className="home-step-num">{s.num}</span>
              <div>
                <strong>{s.label}</strong>
                <span className="home-step-desc">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="home-start-btn" onClick={onStart}>
          Commencer
        </button>
      </div>
    </PageSection>
  );
});

export default HomePage;
