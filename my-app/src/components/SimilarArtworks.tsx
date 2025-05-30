import React, { useEffect, useState, useRef } from 'react';
import { getSetToken } from '../context/ArtworksContext';


interface SimilarArtworksProps {
  id: string;
  close: () => void;
  image: string;
  name: string;
  date: string;
}

interface ArtworkLink {
  self: {
    href: string;
  };
  thumbnail: {
    href: string;
  };
}

interface Artwork {
  id: string;
  name?: string;
  title?: string;
  _links: ArtworkLink;
}

interface ArtworksData {
  _embedded: {
    genes: Artwork[];
  };
}

const SimilarArtworks: React.FC<SimilarArtworksProps> = ({ id, close, image, name ,date}) => {
  const [similarArtworks, setSimilarArtworks] = useState<Artwork[]>([]);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [isNull, setIsNull] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchArt = async (): Promise<void> => {
      const spinElement = document.getElementById("spin");
      if (spinElement) spinElement.style.display = "block"; 
      
      const token = await getSetToken();
      if (!token) {
        console.error("Failed to fetch token");
        if (spinElement) spinElement.style.display = "none";
        setIsNull(true);
        return;
      }
      
      try {
        const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/genes?artwork_id=${id}`, {
          method: 'GET',
          headers: {
            'X-XAPP-Token': token as string
          }
        });
        
        const data: ArtworksData = await response.json();
        if (!data._embedded.genes || data._embedded.genes.length === 0) {
          setIsNull(true);
          console.log("No similar artworks found.");
          if (spinElement) spinElement.style.display = "none";
          return;
        }
        
        setSimilarArtworks(data._embedded.genes);
        if (spinElement) spinElement.style.display = "none"; 
      } catch (err) {
        console.error(err);
        setIsNull(true);
        if (spinElement) spinElement.style.display = "none";
      }
    };
    
    fetchArt();
  }, [id]);
  
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      close();
    }
  };

  return (
    <div
      className="modal fade show d-block"
      role="dialog"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content" ref={modalContentRef}>
          <div className="modal-header">
            <div>
              <span>
                <img src={image} alt="" style={{ width: "40px" }} />
                {name + ", "} {date}
              </span>
              
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={close}
            ></button>
          </div>
          <div className="modal-body">
            <div
              className="spinner-border text-primary"
              id="spin"
              style={{
                display: "none",
                position: "absolute",
                top: "1%",
                left: "49%",
              }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            {isNull ? (
              <div className="alert alert-danger" role="alert">
                No Categories
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
                {similarArtworks.map((artwork) => (
                  <div className="col" key={artwork.id}>
                    <div className="card shadow-sm">
                      <img
                        src={artwork._links.thumbnail.href}
                        className="card-img-top img-fluid"
                        alt={artwork.title}
                        style={{ objectFit: 'cover' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/150";
                        }}
                      />
                      <div className="card-body text-center">
                        <h6 className="card-title">{artwork.name || 'Untitled'}</h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarArtworks;