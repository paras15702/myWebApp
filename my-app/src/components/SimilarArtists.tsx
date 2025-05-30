import React from 'react';
import { useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import env from "react-dotenv";


interface ArtistLink {
  self: {
    href: string;
  };
  thumbnail: {
    href: string;
  };
}

interface Artist {
  id: string;
  title: string;
  name: string;
  _links: ArtistLink;
}

interface ArtistsData {
  _embedded: {
    artists: Artist[];
  };
}

interface SimilarArtistsProps {
  link: string;
  SetSelectedArtist: (artistLink: string) => void;
  isLoggedIn: boolean;
}

const SimilarArtists: React.FC<SimilarArtistsProps> = ({ link, SetSelectedArtist, isLoggedIn }) => {
    const id = link.split('/').pop();
    const [artists, setArtists] = useState<Artist[]>([]);
    

    const handleArtistClick = (artistLink: string, artist: Artist): void => {
        console.log(artist);
        SetSelectedArtist(artistLink);
    };

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

    useEffect(() => {
        console.log("Similar Artists useEffect");
        const fetchArtists = async (): Promise<void> => {

            const token = await getSetToken();
            if (!token) {
                console.error("Failed to get token");
                return;
            }
            try {
                const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/similarto?artist_id=${id}`, {
                    method: 'GET',
                    headers: {
                        'X-XAPP-Token': token as string
                    }
                });
                const data: ArtistsData = await response.json();
                setArtists(data._embedded.artists);
                console.log(data._embedded.artists);
                console.log(artists);
            } catch (err) {
                console.error(err);
            }
        };

        fetchArtists();
    }, [link]);

    const handleAddToFavorites = async (artist: Artist): Promise<void> => {
        const id = artist._links.self.href.split('/').pop();
        console.log("Adding to favorites:");
        try {
            const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/addToFavorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ 
                    artistId: id, 
                    artistName: artist.title, 
                    artistImage: artist._links.thumbnail.href 
                }),
            });

            if (response.ok) {
                alert("Added to favorites!");
            } else {
                alert("Failed to add to favorites.");
            }
        } catch (error) {
            console.error("Error adding to favorites:", error);
        }
    };

    return (
        <div>
            <div
                className="d-flex overflow-auto"
                style={{ whiteSpace: 'nowrap', gap: '1rem' }}
            >
                {artists.map((artist) => (
                    <div
                        className="card shadow-sm"
                        style={{ minWidth: '250px' }}
                        key={artist.id}
                    >
                        <img
                            src={artist._links.thumbnail.href}
                            className="card-img-top img-fluid"
                            alt="Artist Thumbnail"
                            onClick={() => handleArtistClick(artist._links.self.href, artist)}
                        />

                        <div
                            className="card-body text-white text-center"
                            style={{ backgroundColor: '#205375' }}
                        >
                            {artist.title}
                            <h5 className="card-title m-0">{artist.name}</h5>
                            {isLoggedIn && (
                                <button onClick={() => handleAddToFavorites(artist)}>
                                    <i className="bi bi-heart"></i> Add to Favorites
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimilarArtists;