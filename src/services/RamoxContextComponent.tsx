import React, { createContext, useContext } from 'react';
import { useRamox } from './ramoxContext';

const RamoxContext = createContext<ReturnType<typeof useRamox> | null>(null);

export function RamoxProvider({ children }: { children: React.ReactNode }) {
  const ramox = useRamox();
  return (
    <RamoxContext.Provider value={ramox}>
      {children}
    </RamoxContext.Provider>
  );
}

export function useRamoxContext() {
  const context = useContext(RamoxContext);
  if (!context) {
    throw new Error('useRamoxContext must be used within a RamoxProvider');
  }
  return context;
}
