import React, { useEffect, useState } from 'react';

interface FavButtonProps {
  isLoggedIn: boolean;
  isStarFilled: boolean;
  image: string;
  link: string;
}

interface FavoriteStatus {
  [key: string]: boolean;
}

interface Toast {
  id: number;
  type: string;
  message: string;
}

const FavButton: React.FC<FavButtonProps> = ({ isLoggedIn, isStarFilled, image, link }) => {
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

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
    }
  }, [isLoggedIn]);
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

  const fetchArtistInfo = async (id: string): Promise<any> => {

    const token = await getSetToken();
    if (!token) {
      console.error("No valid token found.");
      return null;
    }
    try {
      const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artist/${id}`, {
        method: 'GET',
        headers: {
          'X-XAPP-Token': token as string
        }
      });
      const data = await response.json();

      console.log(data);

      return data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const triggerToast = (type: string, message: string): void => {
    const newToast: Toast = {
      id: Date.now(), 
      type,
      message
    };
    setToasts(prevToasts => [...prevToasts, newToast]);

    
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
    }, 3000);
  };

  
  const removeToast = (id: number): void => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const handleAddToFavorites = async (artist: string): Promise<void> => {
    console.log("Adding to favorites:", artist);
    const id = artist.split('/').pop() as string;
    
    const resp = await fetchArtistInfo(id);

    const newStatus = !favoriteStatus[id];

    setFavoriteStatus(prevStatus => ({
      ...prevStatus,
      [id]: newStatus
    }));

    console.log("Updating favorites status to:", newStatus);
    try {
      const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/addToFavorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          artistId: id,
          artistName: resp?.title || resp?.name,
          artistImage: image,
          addedAt: new Date(),
          isFavorite: newStatus,
          birthday: resp?.birthday,
          deathday: resp?.deathday,
          nationality: resp?.nationality
        }),
      });

      if (response.ok) {
        triggerToast(newStatus ? 'success' : 'error', newStatus ? "Added to favorites." : "Removed from favorites.");
      } else {
        triggerToast('error', "Failed to update favorites.");
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      triggerToast('error', "Error connecting to server.");
    }
  };

  return (
    <img
      src={isStarFilled ? 'filled.gif' : 'empty-star.png'}
      alt="Favorite Star"
      className="img-fluid"
      style={{ cursor: 'pointer', width: '30px', height: '30px' }}
      onClick={() => handleAddToFavorites(link)}
    />
  );
};

export default FavButton;