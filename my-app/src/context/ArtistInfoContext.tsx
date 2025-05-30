import React, { createContext, useState, useContext, ReactNode } from 'react';


interface ArtistData {
  name: string;
  birthday: string;
  deathday: string;
  biography: string;
  nationality: string;
}


interface ArtistInfoContextValue {
  artistData: ArtistData;
  setArtistData: React.Dispatch<React.SetStateAction<ArtistData>>;
  setName: (name: string) => void;
  setBirthday: (birthday: string) => void;
  setDeathday: (deathday: string) => void;
  setBiography: (biography: string) => void;
  setNationality: (nationality: string) => void;
  clearArtistData: () => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}


const ArtistInfoContext = createContext<ArtistInfoContextValue | undefined>(undefined);


interface ArtistInfoProviderProps {
  children: ReactNode;
}

export const ArtistInfoProvider: React.FC<ArtistInfoProviderProps> = ({ children }) => {
  const [artistData, setArtistData] = useState<ArtistData>({
    name: '',
    birthday: '',
    deathday: '',
    biography: '',
    nationality: ''
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  
  const setName = (name: string) => {
    setArtistData(prevData => ({ ...prevData, name }));
  };

  const setBirthday = (birthday: string) => {
    setArtistData(prevData => ({ ...prevData, birthday }));
  };

  const setDeathday = (deathday: string) => {
    setArtistData(prevData => ({ ...prevData, deathday }));
  };

  const setBiography = (biography: string) => {
    setArtistData(prevData => ({ ...prevData, biography }));
  };

  const setNationality = (nationality: string) => {
    setArtistData(prevData => ({ ...prevData, nationality }));
  };

  
  const clearArtistData = () => {
    setArtistData({
      name: '',
      birthday: '',
      deathday: '',
      biography: '',
      nationality: ''
    });
  };

  const value = {
    artistData,
    setArtistData,
    setName,
    setBirthday,
    setDeathday,
    setBiography,
    setNationality,
    clearArtistData,
    isLoading,
    setIsLoading
  };

  return (
    <ArtistInfoContext.Provider value={value}>
      {children}
    </ArtistInfoContext.Provider>
  );
};


export const useArtistInfo = (): ArtistInfoContextValue => {
  const context = useContext(ArtistInfoContext);
  if (context === undefined) {
    throw new Error('useArtistInfo must be used within an ArtistInfoProvider');
  }
  return context;
};