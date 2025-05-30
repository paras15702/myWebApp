import React, { createContext, useState, useContext, ReactNode } from 'react';


interface Artwork {
  id: string;
  title: string;
  _links: {
    thumbnail?: {
      href: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface ArtworksContextValue {
  artworks: Artwork[];
  setArtworks: React.Dispatch<React.SetStateAction<Artwork[]>>;
  selectedArt: string | false;
  setSelectedArt: React.Dispatch<React.SetStateAction<string | false>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  image: string;
  setImage: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  isNull: boolean;
  setIsNull: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenModal: () => void;
  handleCloseModal: () => void;
  handleArtClick: (artLink: string) => void;
}


const ArtworksContext = createContext<ArtworksContextValue | undefined>(undefined);


interface ArtworksProviderProps {
  children: ReactNode;
}


export const ArtworksProvider: React.FC<ArtworksProviderProps> = ({ children }) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArt, setSelectedArt] = useState<string | false>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [image, setImage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isNull, setIsNull] = useState<boolean>(false);

  
  const handleOpenModal = (): void => setShowModal(true);
  const handleCloseModal = (): void => setShowModal(false);
  
  const handleArtClick = (artLink: string): void => {
    setSelectedArt(artLink);
  };

  const value = {
    artworks,
    setArtworks,
    selectedArt,
    setSelectedArt,
    showModal,
    setShowModal,
    image,
    setImage,
    name,
    setName,
    isNull,
    setIsNull,
    handleOpenModal,
    handleCloseModal,
    handleArtClick
  };

  return (
    <ArtworksContext.Provider value={value}>
      {children}
    </ArtworksContext.Provider>
  );
};


export const useArtworks = (): ArtworksContextValue => {
  const context = useContext(ArtworksContext);
  if (context === undefined) {
    throw new Error('useArtworks must be used within an ArtworksProvider');
  }
  return context;
};


export async function getSetToken(): Promise<string | null> {
  const time: number = new Date().getTime();
  
  if (!localStorage.getItem('token')) {
    console.log("no token");
    try {
      const response: Response = await fetch('https://webtechhw3-456400.ue.r.appspot.com/getToken', {
        method: 'POST'
      });
      const data: { token: string } = await response.json();
      console.log(data);
      
      const item = {
        value: data.token,
        expiry: new Date().getTime() + 1000 * 60 * 60 * 24 * 6,
      };
      
      if (data.token) {
        localStorage.setItem('token', JSON.stringify(item));
        return data.token;
      } else {
        throw new Error("No token received");
      }
    } catch (error) {
      console.log('Error fetching token');
      return null;
    }
  }
  
  interface TokenData {
    value: string;
    expiry: number;
  }
  
  const tokenData: TokenData | null = localStorage.getItem('token') ? 
    JSON.parse(localStorage.getItem('token')!) : null;
  
  const expiry: number | undefined = tokenData?.expiry;
  
  if (expiry && time > expiry) {
    console.log("expired");
    localStorage.removeItem('token');
  }
  
  let token: string | undefined = tokenData?.value;
  console.log(token);
  
  if (!token) {
    try {
      const response: Response = await fetch('https://webtechhw3-456400.ue.r.appspot.com/getToken', {
        method: 'POST'
      });
      const data: { token: string } = await response.json();
      console.log(data);
      
      const item = {
        value: data.token,
        expiry: new Date().getTime() + 1000 * 60 * 60 * 24 * 6,
      };
      
      if (data.token) {
        localStorage.setItem('token', JSON.stringify(item));
        return data.token;
      } else {
        throw new Error("No token received");
      }
    } catch (error) {
      console.log('Error fetching token');
      return null;
    }
  } else {
    console.log("cached");
    return token;
  }
}