import { memo } from "react";
import PageSection from "../components/PageSection";

interface Props {
  onStart: () => void;
}

const HomePage = memo(function HomePage({ onStart }: Props) {
  return (
    <PageSection id="home" title="Bienvenue">
      <p className="page-desc">Page d'accueil — à venir.</p>
      <button type="button" onClick={onStart}>
        Commencer
      </button>
    </PageSection>
  );
});

export default HomePage;
