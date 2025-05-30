
import { FC, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import AllArtists from './components/AllArtists';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Favorites from './components/Favorites';
import { AuthContext } from './context/AuthContext';
import NavBar from './components/NavBar';
import PrivateRoute from './context/PrivateRoute';
import Footer from './components/Footer';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import { PreviousLocationProvider } from './context/PreviousLocationContext';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
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


const RouteTracker: FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    
    sessionStorage.setItem('lastPath', location.pathname);
  }, [location.pathname]);
  
  return null;
};


const RefreshHandler: FC = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      
      sessionStorage.removeItem('scrollPosition');
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  return null;
};

const App: FC = () => {
  const { isLoggedIn } = useContext(AuthContext) as AuthContextType;
  const [token, setToken] = useState<string | null>(null);

  
  useEffect(() => {
    const initializeToken = async () => {
      const fetchedToken = await getSetToken();
      setToken(fetchedToken);
    };
    initializeToken();
  }, []);

 

  const PageLoader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn } = useContext(AuthContext) as AuthContextType;
    
    useEffect(() => {
        
        const currentPage = localStorage.getItem('currentPage');
        
        
        if (location.pathname === '/' && currentPage === 'favorites' && isLoggedIn) {
            navigate('/favorites');
        }
    }, [navigate, location, isLoggedIn]);
    
    return null;
};
  
  return (
    <ToastProvider>
      <Router>
        <PreviousLocationProvider>
          
          <RouteTracker />
          <RefreshHandler />
          
          <NavBar />
          <ToastContainer />
          <PageLoader />
          <Routes>
            <Route path="/" element={<AllArtists />} />
            <Route path="/login" element={isLoggedIn ? <AllArtists /> : <LoginPage />} />
            <Route path="/register" element={isLoggedIn ? <AllArtists /> : <RegisterPage />} />
            <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          
          <Footer />
        </PreviousLocationProvider>
      </Router>
    </ToastProvider>
  );
};


const PageNotFound: FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const lastPath = sessionStorage.getItem('lastPath');
    if (lastPath) {
      navigate(lastPath);
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  
  return <div className="text-center my-5">Redirecting...</div>;
};

export default App;