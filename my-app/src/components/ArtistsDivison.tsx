import React, { useEffect, useState, useContext } from 'react';
import ArtistInfo from './ArtistInfo';
import Artworks from './Artworks';
import { AuthContext } from '../context/AuthContext';

interface ArtistsDivisionProps {
  link: string;
  image?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const ArtistsDivision: React.FC<ArtistsDivisionProps> = ({ link, image }) => {
  const [isClicked, setIsClicked] = useState<boolean>(true);
  const [isClicked1, setIsClicked1] = useState<boolean>(false);
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext as React.Context<AuthContextType>);

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

  return (
    <div className="mt-4">
      
      <div className="row">
        <div className="col-6">
          <button
            className='btn w-100 py-3'
            style={isClicked ?
                { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                { color: '#0056b3', backgroundColor: 'transparent' }
            }
            onClick={() => {
              setIsClicked(true);
              setIsClicked1(false);
            }}
          >
            Artists
          </button>
        </div>
        <div className="col-6">
          <button
          className='btn w-100 py-3'
            style={isClicked1 ?
                { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                { color: '#0056b3', backgroundColor: 'transparent' }
            }
            onClick={() => {
              setIsClicked1(true);
              setIsClicked(false);
            }}
          >
            Artworks
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        {isClicked && <ArtistInfo link={link} image={image || ''} />}
        {isClicked1 && <Artworks link={link} />}
      </div>
    </div>
  );
};

export default ArtistsDivision;