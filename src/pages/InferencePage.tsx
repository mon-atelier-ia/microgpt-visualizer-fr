import { useState } from "react";
import { generateName } from "../engine/model";
import Term from "../components/Term";
import PageSection from "../components/PageSection";
import { useModel } from "../modelStore";
import { memo } from "react";
import {
  GeneratePanel,
  GeneratedNames,
  GenerationTrace,
  HowInferenceWorks,
  type GeneratedResult,
} from "./InferencePanels";

let nextResultId = 0;

export default memo(function InferencePage() {
  const model = useModel();
  const [temperature, setTemperature] = useState(5); // x10
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [activeTrace, setActiveTrace] = useState<GeneratedResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const generate = (count: number) => {
    const temp = temperature / 10;
    const newResults: GeneratedResult[] = [];
    for (let i = 0; i < count; i++) {
      newResults.push({ id: nextResultId++, ...generateName(model, temp) });
    }
    setResults((prev) => [...newResults, ...prev]);
    if (newResults[0]) {
      setActiveTrace(newResults[0]);
      setActiveStep(0);
    }
  };

  const selectTrace = (r: GeneratedResult) => {
    setActiveTrace(r);
    setActiveStep(0);
  };

  return (
    <PageSection id="inference" title="6. Inférence">
      <p className="page-desc">
        Après l'entraînement, le modèle génère de nouveaux noms qu'il n'a jamais
        vus. En partant de <Term id="bos" />, il prédit le caractère suivant, en
        échantillonne un (<Term id="echantillonnage" />
        ), le renvoie en entrée, et répète jusqu'à ce que <Term id="bos" />{" "}
        apparaisse à nouveau.
      </p>

      <GeneratePanel
        untrained={model.totalStep === 0}
        onGenerate={generate}
        onClear={() => setResults([])}
        temperature={temperature}
        onTemperatureChange={setTemperature}
      />

      <GeneratedNames
        results={results}
        activeTrace={activeTrace}
        onSelect={selectTrace}
      />

      {activeTrace && (
        <GenerationTrace
          trace={activeTrace}
          activeStep={activeStep}
          onStepChange={setActiveStep}
        />
      )}

      <HowInferenceWorks />
    </PageSection>
  );
});
