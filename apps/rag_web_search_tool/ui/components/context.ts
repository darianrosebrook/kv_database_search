/**
 * React context utilities
 */
import React from "react";

export const createContext = <T>(defaultValue: T) => {
  const Context = React.createContext<T>(defaultValue);

  const useContext = () => {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error("useContext must be used within a Provider");
    }
    return context;
  };

  return [Context, useContext] as const;
};
