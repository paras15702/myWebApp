
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PreviousLocationContext = createContext<string | null>(null);

export const PreviousLocationProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setPreviousLocation(location.pathname); 
    };
  }, [location]);

  return (
    <PreviousLocationContext.Provider value={previousLocation}>
      {children}
    </PreviousLocationContext.Provider>
  );
};

export const usePreviousLocation = () => useContext(PreviousLocationContext);
