import { createContext, useContext } from "react";

export interface TermModalContext {
  openModal: (id: string) => void;
}

export const TermModalCtx = createContext<TermModalContext>({
  openModal: () => {},
});

export function useTermModal() {
  return useContext(TermModalCtx);
}
