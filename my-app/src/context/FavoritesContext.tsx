import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthContext } from './AuthContext';


interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface Artist {
  id?: string;
  name?: string;
  title?: string;
  birthday?: string;
  deathday?: string;
  nationality?: string;
  biography?: string; 
  _links?: {
    self: {
      href: string;
    };
    thumbnail: {
      href: string;
    };
  };
}

interface FavoriteStatus {
  [key: string]: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'danger';
  message: string;
}

export interface FavoriteContextValue {
  favoriteStatus: FavoriteStatus;
  toggleFavorite: (artist: Artist | string, image?: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  toasts: Toast[];
  removeToast: (id: string) => void;
  setFavoriteStatus: React.Dispatch<React.SetStateAction<FavoriteStatus>>;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesContext = createContext<FavoriteContextValue | undefined>(undefined);

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
    const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({});
    const [toasts, setToasts] = useState<Toast[]>([]);
    const { isLoggedIn } = useContext(AuthContext) as AuthContextType;

    
    useEffect(() => {
        async function loadFavorites(): Promise<void> {
            try {
                const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/getFavorites", {
                    credentials: "include"
                });
                if (response.ok) {
                    const favorites = await response.json();

                    
                    const favoritesObj: FavoriteStatus = {};
                    favorites.forEach((fav: { artistId: string }) => {
                        favoritesObj[fav.artistId] = true;
                    });

                    setFavoriteStatus(favoritesObj);
                }
            } catch (error) {
                console.error("Error loading favorites:", error);
            }
        }

        if (isLoggedIn) {
            loadFavorites();
        } else {
            
            setFavoriteStatus({});
        }
    }, [isLoggedIn]);

    
    const fetchArtistInfo = async (id: string): Promise<Artist | null> => {
        async function getSetToken(): Promise<string | null> {
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

          const token = await getSetToken();

            if (!token) {
                console.error("No token available for fetching artist info.");
                return null;
            }
        try {
            const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artist/${id}`, {
                method: 'GET',
                headers: {
                    'X-XAPP-Token': token as string
                }
            });
            const data: Artist = await response.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    
    const triggerToast = (type: 'success' | 'danger', message: string): void => {
        const newToast: Toast = {
            id: Date.now().toString(),
            type,
            message
        };
        setToasts(prevToasts => [...prevToasts, newToast]);

        
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
        }, 3000);
    };

    const removeToast = (id: string): void => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    
    const toggleFavorite = async (artist: Artist | string, image?: string): Promise<void> => {
        if (!isLoggedIn) return;

        
        let id: string, artistData: Artist | null, artistName: string, artistImage: string;

        if (typeof artist === 'string') {
            
            id = artist.split('/').pop() || '';
            artistData = await fetchArtistInfo(id);
            artistName = artistData?.name || artistData?.title || '';
            artistImage = image || ''; 
        } else {
            
            id = artist._links?.self.href.split('/').pop() || '';
            artistName = artist.title || artist.name || '';
            artistImage = artist._links?.thumbnail.href || '';
            artistData = await fetchArtistInfo(id);
        }

        
        const newStatus = !favoriteStatus[id];

        
        setFavoriteStatus(prevStatus => ({
            ...prevStatus,
            [id]: newStatus
        }));

        try {
            const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/addToFavorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    artistId: id,
                    artistName: artistName,
                    artistImage: artistImage,
                    addedAt: new Date(),
                    isFavorite: newStatus,
                    birthday: artistData?.birthday || '',
                    deathday: artistData?.deathday || '',
                    nationality: artistData?.nationality || '',
                    biography: artistData?.biography || ''
                }),
            });

            if (response.ok) {
                triggerToast(newStatus ? 'success' : 'danger', newStatus ? "Added to favorites." : "Removed from favorites.");
            } else {
                triggerToast('danger', "Failed to update favorites.");
                
                setFavoriteStatus(prevStatus => ({
                    ...prevStatus,
                    [id]: !newStatus
                }));
            }
        } catch (error) {
            console.error("Error updating favorites:", error);
            triggerToast('danger', "Error connecting to server.");
            
            setFavoriteStatus(prevStatus => ({
                ...prevStatus,
                [id]: !newStatus
            }));
        }
    };

    
    const isFavorite = (id: string): boolean => {
        return Boolean(favoriteStatus[id]);
    };

    return (
        <FavoritesContext.Provider value={{
            favoriteStatus,
            toggleFavorite,
            isFavorite,
            toasts,
            removeToast,
            setFavoriteStatus
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};