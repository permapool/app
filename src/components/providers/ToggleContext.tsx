"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type ToggleContextType = {
  showPermapool: boolean;
  showSquad: boolean;
  showProposals: boolean;
  showManifesto: boolean;

  togglePermapool: () => void;
  toggleSquad: () => void;
  toggleProposals: () => void;
  toggleManifesto: () => void;
};

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

export const ToggleProvider = ({ children }: { children: ReactNode }) => {
  const [showPermapool, setShowPermapool] = useState(false);
  const [showSquad, setShowSquad] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);

  const togglePermapool = () => {
    setShowPermapool(p => !p);
    setShowSquad(false);
    setShowProposals(false);
    setShowManifesto(false);
  };

  const toggleSquad = () => {
    setShowSquad(p => !p);
    setShowPermapool(false);
    setShowProposals(false);
    setShowManifesto(false);
  };

  const toggleProposals = () => {
    setShowProposals(p => !p);
    setShowPermapool(false);
    setShowSquad(false);
    setShowManifesto(false);
  };

  const toggleManifesto = () => {
    setShowManifesto(p => !p);
    setShowPermapool(false);
    setShowSquad(false);
    setShowProposals(false);
  };

  return (
    <ToggleContext.Provider
      value={{
        showPermapool,
        showSquad,
        showProposals,
        showManifesto,
        togglePermapool,
        toggleSquad,
        toggleProposals,
        toggleManifesto,
      }}
    >
      {children}
    </ToggleContext.Provider>
  );
};

export const useToggle = () => {
  const context = useContext(ToggleContext);
  if (!context) throw new Error("useToggle must be used within ToggleProvider");
  return context;
};
