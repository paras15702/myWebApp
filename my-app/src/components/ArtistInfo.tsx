import React, { useEffect, useContext , useState} from 'react';
import { AuthContext } from '../context/AuthContext';
import { FavoritesContext } from '../context/FavoritesContext';
import { useArtistInfo } from '../context/ArtistInfoContext';

interface ArtistInfoProps {
  link: string;
  image: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
}

interface FavoritesContextType {
  favoriteStatus: Record<string, boolean>;
  toggleFavorite: (link: string, image: string) => void;
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

const ArtistInfo: React.FC<ArtistInfoProps> = ({ link, image }) => {
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
  
  const { isLoggedIn } = useContext(AuthContext) as AuthContextType;
  const [showStar, setShowStar] = useState<boolean>(false);
  const { favoriteStatus, toggleFavorite } = useContext(FavoritesContext) as FavoritesContextType;
  const id = link.split('/').pop() || '';

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStar(true);
    }, 300);

    const fetchArtistInfo = async (): Promise<void> => {
      
      const cachedData = localStorage.getItem(`artistInfo-${id}`);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setName(data.name);
        setBirthday(data.birthday);
        setDeathday(data.deathday);
        setBiography(data.biography);
        setNationality(data.nationality);
        setShowStar(true);
        return;
      }
      
     
      const spinnerElement = document.querySelector('#spin') as HTMLElement;
      if (spinnerElement) {
        spinnerElement.style.display = "block";
      }
      
      
      clearArtistData();
      setShowStar(false);
      setIsLoading(true);
      
      try {
        const token = await getSetToken();
        if (!token) {
          console.error("Failed to fetch token");
          return;
        }

        const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artist/${id}`, {
          method: 'GET',
          headers: {
            'X-XAPP-Token': token || ''
          }
        });
        const data = await response.json();
        
        
        localStorage.setItem(`artistInfo-${id}`, JSON.stringify(data));
        
        const spinElement = document.querySelector('#spin') as HTMLElement;
        if (spinElement) {
          spinElement.style.display = "none";
        }
        
        setName(data.name);
        setBirthday(data.birthday);
        setDeathday(data.deathday);
        setBiography(data.biography);
        setNationality(data.nationality);
        setShowStar(true);
        setIsLoading(false);
        console.log(data);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    
    fetchArtistInfo();
    return () => clearTimeout(timer);
  }, [link, id]);

  const isStarFilled = favoriteStatus[id] || false;

  return (
    <>
      <div
        className="spinner-border text-primary"
        id="spin"
        style={{
          display: isLoading ? "block" : "none",
          position: "absolute",
          top: "75%",
          left: "49%",
          flex: '1 1 calc(20% - 1rem)',
          maxWidth: 'calc(20% - 1rem)',
          boxSizing: 'border-box',
        }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <div id="info">
        <span className="d-flex justify-content-center align-items-center gap-2 fw-medium fs-4">
          {name}
          {isLoggedIn && showStar && (
            <i
              className={`bi ${isStarFilled ? 'bi-star-fill' : 'bi-star'}`}
              style={{
                cursor: 'pointer',
                fontSize: '30px',
                width: '30px',
                height: '42px',
                borderColor: isStarFilled ? 'gold' : 'black',
                color: isStarFilled ? 'gold' : 'gray',
              }}
              onClick={() => toggleFavorite(link, image)}
            ></i>
          )}
        </span>

        {(nationality || birthday || deathday) && (
          <p className="fw-low d-flex justify-content-center align-items-center">
            {nationality && <span>{nationality}</span>}
            {nationality && (birthday || deathday) && ', '}
            {(birthday || deathday) && (
              <span> {birthday ? birthday : ""} - {deathday ? deathday : ""}</span>
            )}
          </p>
        )}

        {biography && (
          <section className="mt-3" style={{ textAlign: "justify" }}>
            {biography
              .replace(/[\u0096\u2013\u2014]/g, '-')
              .split('\n\n')
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </section>
        )}
      </div>
    </>
  );
};

export default ArtistInfo;