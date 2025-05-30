import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useArtistInfo } from '../context/ArtistInfoContext';


interface Artist {
  _id: string;
  artistId: string;
  artistName: string;
  artistImage: string;
  addedAt: string;
  birthday?: string;
  deathday?: string;
  nationality?: string;
}

interface TimeAgoMap {
  [key: string]: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}


interface Toast {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  id: number;
}

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

const Favorites: React.FC = () => {
  const { 
    artistData: { name, birthday, deathday, biography, nationality },
    setName, 
    setBirthday, 
    setDeathday, 
    setBiography, 
    setNationality,
    clearArtistData,
    isLoading,
    setIsLoading
  } = useArtistInfo();
  
  const [artists, setArtists] = useState<Artist[]>([]);
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext) as AuthContextType;
  const [timeAgo, setTimeAgo] = useState<TimeAgoMap>({});
  const [isNull, setIsNull] = useState<boolean>(false); 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  
  useEffect(() => {
    localStorage.setItem('currentPage', 'favorites');
  }, []);
  
  useEffect(() => {
    const fetchFavorites = async () => {
      const spinElement = document.getElementById("spin");
      if (spinElement) spinElement.style.display = "block"; 
      
      try {
        const response = await fetch('https://webtechhw3-456400.ue.r.appspot.com/getFavorites', {
          method: 'GET',
          credentials: 'include',
        });
        const data: Artist[] = await response.json();
        console.log(data);
        if (data.length === 0) {
          setIsNull(true); 
        } else {
          setIsNull(false); 
        }
        setArtists(data);
        
        if (spinElement) spinElement.style.display = "none"; 
        const initialTimeAgo: TimeAgoMap = {};
        data.forEach(artist => {
          initialTimeAgo[artist.artistId] = calculateTimeAgo(artist.addedAt);
        });
        setTimeAgo(initialTimeAgo);

      } catch (err) {
        console.error(err);
        showToast("Failed to fetch favorite artists", "danger");
      }
    }

    if (isLoggedIn) {
      fetchFavorites();
    } else {
      setArtists([]);
    }
  }, [isLoggedIn]); 
  const calculateTimeAgo = (timestamp: string): string => {
    const addedAt = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - addedAt.getTime()) / 1000);

    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

 
  useEffect(() => {
    const updateAllTimers = () => {
      const newTimeAgo: TimeAgoMap = {};
      artists.forEach(artist => {
        newTimeAgo[artist.artistId] = calculateTimeAgo(artist.addedAt);
      });
      setTimeAgo(newTimeAgo);
    };

    
    updateAllTimers();
    const intervalId = setInterval(updateAllTimers, 1000);

    
    return () => clearInterval(intervalId);
  }, [artists]); 

  
  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const remove = async (id: string, artistName: string) => {
    try {
      const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/removeFavorites?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        const filteredArtists = artists.filter(artist => artist._id !== id);
        setArtists(filteredArtists);
        if (filteredArtists.length === 0) {
          setIsNull(true);
        }
        
        showToast(`removed from favorites`, "success");
      } else {
        console.error('Failed to remove favorite artist');
        showToast("Failed to remove artist from favorites", "danger");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while removing the artist", "danger");
    }
  }

  const handleArtistClick = async (artist: Artist, event: React.MouseEvent) => {
    
    if ((event.target as HTMLElement).tagName === 'BUTTON' || 
        (event.target as HTMLElement).closest('button')) {
      return;
    }
    
    
    clearArtistData();
    
    
    setIsLoading(true);
    
    try {
      
      setName(artist.artistName);
      if (artist.birthday) setBirthday(artist.birthday);
      if (artist.deathday) setDeathday(artist.deathday);
      if (artist.nationality) setNationality(artist.nationality);
      
      
      const token = await getSetToken();
      if (!token) {
        console.error("Failed to fetch token");
        setIsLoading(false);
        return;
      }

      
      const cachedData = localStorage.getItem(`artistInfo-${artist.artistId}`);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setName(data.name);
        setBirthday(data.birthday);
        setDeathday(data.deathday);
        setBiography(data.biography);
        setNationality(data.nationality);
      } else {
        
        const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artist/${artist.artistId}`, {
          method: 'GET',
          headers: {
            'X-XAPP-Token': token
          }
        });
        
        const data = await response.json();
        
        
        localStorage.setItem(`artistInfo-${artist.artistId}`, JSON.stringify(data));
        
        
        setName(data.name);
        setBirthday(data.birthday);
        setDeathday(data.deathday);
        setBiography(data.biography);
        setNationality(data.nationality);
      }
      
      
      const artistLink = `https://api.artsy.net/api/artists/${artist.artistId}`;
      localStorage.setItem('selectedArtistLink', artistLink);
      localStorage.setItem('selectedArtistImage', artist.artistImage);
      localStorage.setItem('selectedArtistId', artist.artistId);
      localStorage.setItem('currentPage', 'home'); 
      
      setIsLoading(false);
      
      
      navigate('/');
    } catch (err) {
      console.error("Error fetching artist data:", err);
      setIsLoading(false);
      
    }
  };

  return (
    <div className="container mt-4">
      <div className="toast-container position-fixed top-3 end-0 p-3" style={{ zIndex: 1050, maxWidth: '210px', top: '70px', right: '10px', opacity: 0.8 }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast show d-flex justify-content-between align-items-center text-white bg-danger border-0`} 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            style={{ 
              fontSize: '0.7rem', 
              padding: '0.5rem 0.75rem',
              minHeight: '48px',
              lineHeight: '1.2',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {toast.message}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white ms-2" 
              onClick={() => dismissToast(toast.id)} 
              aria-label="Close"
            />
          </div>
        ))}
      </div>
      <div
        className="spinner-border text-primary"
        id="spin"
        style={{
          display: "none",
          position: "absolute",
          top: "15%",
          left: "49%",
        }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="row g-4">
        {!isNull ? (
          
          artists
            .sort((a, b) => {
              
              const timeA = timeAgo[a.artistId] || '';
              const timeB = timeAgo[b.artistId] || '';
              
              
              const getSeconds = (timeStr: string): number => {
                if (!timeStr) return Infinity; 
                
                const [value, unit] = timeStr.split(' ');
                const numValue = parseInt(value);
                
                if (unit.startsWith('second')) return numValue;
                if (unit.startsWith('minute')) return numValue * 60;
                if (unit.startsWith('hour')) return numValue * 3600;
                if (unit.startsWith('day')) return numValue * 86400;
                
                return Infinity; 
              };
              
              
              return getSeconds(timeA) - getSeconds(timeB);
            })
            .map((artist) => (
              <div key={artist.artistId} className="col-md-4 ">
                <div
                  className="card text-white position-relative"
                  style={{
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "none",
                    height: '200px',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleArtistClick(artist, e)} 
                >
                  
                  <div
                    style={{
                      backgroundImage: `url(${artist.artistImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      filter: "brightness(0.6) blur(3px)",
                    }}
                  ></div>
                  
                  
                  <div className="card-body position-relative p-4">
                    <div>
                      <h2 className="fs-3 fw-bold mb-0">{artist.artistName}</h2>
                      <p className="mb-1">{artist.birthday} - {artist.deathday}</p>
                      <p>{artist.nationality}</p>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mt-5" style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                      <small className="text-white-50">
                        {timeAgo[artist.artistId]} ago
                      </small>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          remove(artist._id, artist.artistName);
                        }}
                        className="btn btn-link text-white p-0 text-decoration-underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="alert alert-danger" role="alert" style={{width:'100%'}}>
            No Favorite artists.
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;