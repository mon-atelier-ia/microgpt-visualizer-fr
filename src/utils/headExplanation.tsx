import type { HeadPersonality } from "./classifyHead";

export function headExplanation(
  personality: HeadPersonality,
  token: string,
): React.ReactNode {
  switch (personality) {
    case "Ancrage":
      return (
        <>
          Cette tête revient souvent vers le <b>début</b> du nom (BOS) et vers{" "}
          <b>elle-même</b>. Elle garde un repère fixe.
        </>
      );
    case "Précédent":
      return (
        <>
          Cette tête s'intéresse surtout au token <b>juste avant</b> « {token}{" "}
          ». La lettre précédente influence fortement la suivante.
        </>
      );
    case "Écho":
      return (
        <>
          Cette tête cherche des <b>tokens proches</b> vus récemment — les 2-3
          dernières lettres avant « {token} ».
        </>
      );
    case "Contexte":
      return (
        <>
          Cette tête <b>regarde un peu partout</b>. Elle capte le contexte
          général — toutes les lettres déjà vues comptent.
        </>
      );
  }
}
