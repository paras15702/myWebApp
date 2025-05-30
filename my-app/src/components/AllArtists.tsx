
import React, { useState, useEffect, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import ArtistsDivison from './ArtistsDivison';


interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Artist {
  id: string;
  title?: string;
  name?: string;
  _links?: {
    self: {
      href: string;
    };
    thumbnail: {
      href: string;
    };
  };
}

const AllArtists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [name, setName] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string | false>(false);
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext as React.Context<AuthContextType>);
  const [image, setImage] = useState<string>('');
  const [isNull, setIsNull] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null); 
  const favoritesContext = useContext(FavoritesContext);
  
  
  if (!favoritesContext) {
    throw new Error("FavoritesContext must be used within a FavoritesProvider");
  }
  
  const { favoriteStatus, toggleFavorite, toasts, removeToast, setFavoriteStatus } = favoritesContext;

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const headers: Record<string, string> = {};
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
        const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/verifyToken", {
          method: "GET",
          credentials: "include", 
          headers:headers
        });

        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [setIsLoggedIn]);

  useEffect(() => {
    async function loadFavorites(): Promise<void> {
      try {
        const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/getFavorites", {
          credentials: "include"
        });
        if (response.ok) {
          const favorites = await response.json();

          
          const favoritesObj: Record<string, boolean> = {};
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
  }, [isLoggedIn, setFavoriteStatus]);

 

  const handleArtistClick = (artistLink: string, artist: Artist, id: string): void => {
    setImage(artist._links?.thumbnail.href || '');
    setSelectedArtist(artistLink);
    setSelectedArtistId(id);
    
    
    localStorage.setItem('selectedArtistLink', artistLink);
    localStorage.setItem('selectedArtistImage', artist._links?.thumbnail.href || '');
    localStorage.setItem('selectedArtistId', id);
    
    handleSimilarArtists(artistLink, id);
  }

  

  useEffect(() => {
    const storedArtistLink = localStorage.getItem('selectedArtistLink');
    const storedArtistImage = localStorage.getItem('selectedArtistImage');
    const storedArtistId = localStorage.getItem('selectedArtistId');
    
    if (storedArtistLink && storedArtistImage && storedArtistId) {
      setSelectedArtist(storedArtistLink);
      setImage(storedArtistImage);
      setSelectedArtistId(storedArtistId);
      
      handleSimilarArtists(storedArtistLink, storedArtistId);
    }
  }, []);

  const handleSimilarArtists = (artistLink: string, id: string): void => {
    const artistId = artistLink.split('/').pop();

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
    
    const fetchSimilarArtists = async (): Promise<void> => {

      const token = await getSetToken();
      if (!token) {
        console.error("Failed to get token");
        return;
      }
      try {
        const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/similarto?artist_id=${artistId}`, {
          method: 'GET',
          headers: {
            'X-XAPP-Token': token as string
          }
        });
        const data = await response.json();
        setSimilarArtists(data._embedded.artists);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSimilarArtists();
  }

  const clearAll = (): void => {
    setArtists([]);
    setName('');
    setSelectedArtist(false);
    setSimilarArtists([]);
    setIsNull(false);
    setSelectedArtistId(null); 
    localStorage.clear();
  }
  
  const fetchArtists = async (): Promise<void> => {
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
    setIsLoading(true);

    
    try {
      const token = await getSetToken();
      if (!token) {
        console.error("Failed to get token");
        setIsLoading(false);
        return;
      }
      const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artists?name=${name}`, {
        method: 'GET',
        headers: {
          'X-XAPP-Token': token as string
        }
      });
      const data = await response.json();
      setArtists(data._embedded.results);
      
      if (data._embedded.results.length === 0) {
        setIsNull(true);
      } else {
        setIsNull(false);
      }
    } catch (err) {
      console.error(err);
      setIsNull(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getArtistName = (artist: Artist): string => {
    return artist.title || artist.name || 'Unknown Artist';
  };

  const getImageUrl = (artist: Artist): string => {
    const thumbnail = artist._links?.thumbnail.href;
    return (thumbnail === "/assets/shared/missing_image.png") ? "/artsy_logo.svg" : thumbnail || "/artsy_logo.svg";
  };

  
  const getCardBodyStyle = (id: string) => {
    const isSelected = id === selectedArtistId;
    return {
      backgroundColor: isSelected ? '#0056b3' : '#1E1E1E',
      padding: '10px 15px',
      textAlign: 'left' as const,
      borderBottomLeftRadius: '4px',
      borderBottomRightRadius: '4px',
      transition: 'background-color 0.3s ease' 
    };
  };

 
  const getSimilarCardBodyStyle = (id: string) => {
    const isSelected = id === selectedArtistId;
    return {
      backgroundColor: isSelected ? '#0056b3' : '#1E1E1E',
      padding: '12px 15px',
      textAlign: 'left' as const,
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
      transition: 'background-color 0.3s ease' 
    };
  };

  return (
    <div className=" mt-4" style={{marginLeft:'15%',marginRight:'15%'}}>
      
      <div className="input-group mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              fetchArtists();
            }}}
          style={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            height: "38px"
          }}
          onFocus={() => {
            const element = document.getElementById('search');
            if (element) {
              element.style.backgroundColor = "#0056b3";
            }
          }}

          onBlur={() => {
            const element = document.getElementById('search');
            if (element) {
              element.style.backgroundColor = "#337ab7";
            }
          }}
        />
        <button
          className="btn btn-primary"
          onClick={fetchArtists}
          id='search'
          style={{
            backgroundColor: "#337ab7",
            borderRadius: 0
          }}
          disabled={isLoading}
        >
          Search {isLoading && <span className="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>}
        </button>
        <button
          className="btn btn-secondary"
          onClick={clearAll}
          style={{
            backgroundColor: "#6c757d",
            borderTopRightRadius: 7,
            borderBottomRightRadius: 7
          }}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>

      
      {isNull ? (
        <div className="alert alert-danger" role="alert">
          No results found
        </div>
      ) : (
        <>
          {artists.length > 0 && (
            <div className="mb-4">
              <div
                className="d-flex overflow-auto"
                style={{ whiteSpace: 'nowrap', gap: '1rem', paddingBottom: '1rem' }}
              >
                {artists.map((artist) => {
                  const id = artist._links?.self.href.split('/').pop() || '';
                  const isStarFilled = favoriteStatus[id] || false;

                  return (
                    <div
                      className="card"
                      style={{ 
                        width: '200px', 
                        flexShrink: 0,
                        border: 'none', 
                        marginBottom: '10px', 
                        position: 'relative',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      key={artist.id}
                    >
                      {isLoggedIn && (
                        <i
                          className={`bi ${isStarFilled ? 'bi-star-fill' : 'bi-star'}`}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#004080', 
                            borderColor: isStarFilled ? 'gold' : 'white',
                            color: isStarFilled ? 'gold' : '#ccc',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            cursor: 'pointer',
                            boxShadow: '0 0 3px rgba(129, 17, 17, 0.3)',
                          }}
                          onClick={() => toggleFavorite(artist)}
                        />
                      )}

                      <img
                        src={getImageUrl(artist)}
                        className="card-img-top"
                        alt={`${getArtistName(artist)} Thumbnail`}
                        style={{ 
                          cursor: 'pointer', 
                          objectFit: 'cover', 
                          width: '100%', 
                          aspectRatio: '1/1',
                          borderTopLeftRadius: '4px',
                          borderTopRightRadius: '4px'
                        }}
                        onClick={() => handleArtistClick(artist._links?.self.href || '', artist, id)}
                      />

                      <div
                        className="card-body text-white"
                        style={getCardBodyStyle(id)}
                      >
                        <h5 className="card-title m-0" style={{ fontSize: '1rem', fontWeight: 'normal' }}>
                          {getArtistName(artist)}
                        </h5>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          
          {selectedArtist && <ArtistsDivison link={selectedArtist} image={image} />}
          
          
          {isLoggedIn && selectedArtist && similarArtists.length > 0 && (
            <div className="mt-4 mb-4">
              <h2 className="mb-3">Similar Artists</h2>
              <div
                className="d-flex flex-wrap"
                style={{
                  gap: '1rem',
                  marginBottom: '2rem'
                }}
              >
                {similarArtists.map((artist) => {
                  const id = artist._links?.self.href.split('/').pop() || '';
                  const isStarFilled = favoriteStatus[id] || false;

                  return (
                    <div
                      key={artist.id}
                      style={{
                        flex: '1 0 calc(20% - 1rem)',
                        maxWidth: 'calc(20% - 1rem)',
                        minWidth: '180px'
                      }}
                    >
                      <div
                        className="card h-100"
                        style={{
                          width: '100%',
                          border: 'none',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          position: 'relative'
                        }}
                      >
                        {isLoggedIn && (
                          <i
                            className={`bi ${isStarFilled ? 'bi-star-fill' : 'bi-star'}`}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: '#004080',
                              borderColor: isStarFilled ? 'gold' : 'white',
                              color: isStarFilled ? 'gold' : '#ccc',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              cursor: 'pointer',
                              boxShadow: '0 0 3px rgba(0,0,0,0.3)',
                            }}
                            onClick={() => toggleFavorite(artist)}
                          />
                        )}

                        <img
                          src={getImageUrl(artist)}
                          className="card-img-top"
                          alt={`${getArtistName(artist)} Thumbnail`}
                          style={{
                            objectFit: 'cover',
                            width: '100%',
                            aspectRatio: '1/1',
                            cursor: 'pointer',
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px'
                          }}
                          onClick={() => handleArtistClick(artist._links?.self.href || '', artist, id)}
                        />

                        <div
                          className="card-body text-white"
                          style={getSimilarCardBodyStyle(id)}
                        >
                          <h5
                            className="card-title"
                            style={{
                              fontSize: '1rem',
                              margin: 0,
                              fontWeight: '400',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {getArtistName(artist)}
                          </h5>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

<div className="toast-container position-fixed end-0 p-3" style={{ zIndex: 1050, maxWidth: '210px', top: '70px', right: '10px', opacity: 0.8 }}>
  {toasts.map((toast) => (
    <div 
      key={toast.id} 
      className={`toast show d-flex justify-content-between align-items-center text-white bg-${toast.type} border-0`} 
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
        onClick={() => removeToast(toast.id)} 
        aria-label="Close"
        
      />
    </div>
  ))}
</div>

    </div>
  );
};

export default AllArtists;