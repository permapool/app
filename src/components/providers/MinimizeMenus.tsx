import React, { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

type MinimizeContextType = {
  minimized: boolean;
  setMinimized: Dispatch<SetStateAction<boolean>>;
};

const MinimizeContext = createContext<MinimizeContextType | undefined>(undefined);

export const useMinimize = () => {
  const ctx = useContext(MinimizeContext);
  if (!ctx) throw new Error("useMinimize must be used within MinimizeMenusProvider");
  return ctx;
};

export const MinimizeMenusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [minimized, setMinimized] = useState(false);
  return (
    <MinimizeContext.Provider value={{ minimized, setMinimized }}>
      {children}
    </MinimizeContext.Provider>
  );
};