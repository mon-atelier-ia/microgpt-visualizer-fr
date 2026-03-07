import { memo, useMemo } from "react";
import { useModel } from "../modelStore";
import { gptForward, N_LAYER } from "../engine/model";
import type { Value } from "../engine/autograd";
import PageSection from "../components/PageSection";
import FullNNDiagram from "../components/FullNNDiagram";

const FullModelPage = memo(function FullModelPage() {
  const model = useModel();

  const trace = useMemo(() => {
    const keys = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    const vals = Array.from({ length: N_LAYER }, () => [] as Value[][]);
    return gptForward(0, 0, keys, vals, model, true).trace!;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model is mutable: identity detects reset, totalStep detects training
  }, [model, model.totalStep]);

  return (
    <PageSection id="fullmodel" title="7. Modèle complet">
      <p className="page-desc">
        Voici toute la machine assemblée — les 16 couches que tu as explorées
        une par une dans les étapes précédentes.
      </p>
      <div className="full-nn-canvas-wrap">
        <FullNNDiagram
          tokEmb={trace.tokEmb}
          posEmb={trace.posEmb}
          combined={trace.combined}
          afterNorm={trace.afterNorm}
          preAttnNorm={trace.preAttnNorm}
          q={trace.q}
          k={trace.k}
          v={trace.v}
          attnWeights={trace.attnWeights}
          afterAttn={trace.afterAttn}
          preMlpNorm={trace.preMlpNorm}
          mlpHidden={trace.mlpHidden}
          mlpActiveMask={trace.mlpActiveMask}
          afterMlp={trace.afterMlp}
          logits={trace.logits}
          probs={trace.probs}
        />
      </div>
      <div className="full-nn-mobile-msg">
        Pour voir l'architecture complète, utilise un écran plus large (≥768px).
      </div>
    </PageSection>
  );
});

export default FullModelPage;
