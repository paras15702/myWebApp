
import React, { useEffect, useContext, useState } from 'react';
import SimilarArtworks from './SimilarArtworks';
import { AuthContext } from '../context/AuthContext';
import { useArtworks, getSetToken } from '../context/ArtworksContext';

interface ArtworksProps {
  link: string;
}

interface SimilarArtworksProps {
  
  date: string; 
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Artworks: React.FC<ArtworksProps> = ({ link }) => {
  console.log("linkkkkkkkkkkkkkkkkkkkkkkkk " + link);
  
  const { 
    artworks, 
    setArtworks, 
    selectedArt, 
    showModal, 
    image, 
    setImage, 
    name, 
    setName, 
    isNull, 
    setIsNull, 
    handleOpenModal, 
    handleCloseModal, 
    handleArtClick 
  } = useArtworks();
  
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext as React.Context<AuthContextType>);
  const [date,setDate] = useState<string>('');
  console.log(link);
  const id = link.split('/').pop();

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/verifyToken", {
          method: "GET",
          credentials: "include", 
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

  const fetchArtworks = async (): Promise<void> => {
    setIsNull(false); 
    try {
      const token = await getSetToken();
      if (!token) {
        console.error("Failed to get token");
        setIsNull(true);
        return;
      }
      const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/artwork?artist_id=${id}&size=5`, {
        method: 'GET',
        headers: {
          'X-XAPP-Token': token as string
        }
      });
      
      const data = await response.json();
      console.log("check");
      console.log(data._embedded.artworks);
      setArtworks(data._embedded.artworks);
      
      if (data._embedded.artworks.length === 0) {
        setIsNull(true);
      } else {
        setIsNull(false);
      }
      
      console.log(data);
    } catch (err) {
      console.error(err);
      setIsNull(true);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, [link, id]);

  return (
    <div className="container mt-4">
      {isNull ? (
        <div className="alert alert-danger" role="alert">
          No artworks.
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
          {artworks.map((artwork) => (
            <div className="col" key={artwork.id}>
              <div className="card shadow-sm">
                <img
                  src={artwork._links.thumbnail ? artwork._links.thumbnail.href : ""}
                  className="card-img-top"
                  alt={artwork.title}
                  style={{ objectFit: 'cover' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150";
                  }}
                />
                <div className="card-body p-2 text-center" style={{color:'white'}}>
                  <p className="card-text mb-1" style={{ fontSize: '1rem', color:'black' }}>{artwork.title + ", "+artwork.date || 'Untitled'}</p>
                  <button
                    className="btn btn-sm w-100 border-0"
                    style={{ fontSize: '1rem', fontWeight: 'normal', padding: '0.25rem', backgroundColor:'#f8f9fa'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0056b3';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.color = 'black';
                    }}
                    onClick={() => {
                      if (artwork._links.thumbnail) {
                        setImage(artwork._links.thumbnail.href);
                      }
                      setName(artwork.title);
                      setDate(artwork.date);
                      handleArtClick(artwork.id);
                      handleOpenModal();
                    }}
                  >
                    View categories
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {showModal && (
        <SimilarArtworks 
          id={selectedArt as string} 
          close={handleCloseModal} 
          image={image} 
          name={name} 
          date={date}
        />
      )}
    </div>
  );
};

export default Artworks;