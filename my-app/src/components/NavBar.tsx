import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UserData {
  name?: string;
  email?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  id: number;
}

const NavBar: React.FC = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext) as AuthContextType;
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('John Doe');
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  
  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Handle outside click for mobile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/verifyToken", {
          method: "GET",
          credentials: "include", 
        });

        if (response.ok) {
          setIsLoggedIn(true);

          try {
            const data: UserData = await response.json();
            if (data.name) {
              setUserName(data.name);
            }

            try {
              const email = data.email;
              if (email) {
                const response = await fetch(`https://webtechhw3-456400.ue.r.appspot.com/getGravatar?email=${email}`, {
                  method: 'GET',
                  credentials: 'include',
                });
                const grav = await response.json();
                setAvatarUrl(grav.gravatarUrl);
              }
            } catch (err) {
              console.log(err);
            }
          } catch (err) {
            console.log(err);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [setIsLoggedIn, navigate]);

  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/deleteAccount", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        setIsLoggedIn(false);
        showToast(`Account Deleted`, "danger");
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        showToast("Failed to delete account.", "danger");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showToast("Error deleting account", "danger");
    }
  };

  const logoutAccount = async (): Promise<void> => {
    try {
      const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.clear();
        sessionStorage.clear();
        setIsLoggedIn(false);
        showToast(`Logged Out`, "success");
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        showToast("Failed to log out.", "warning");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("Error logging out", "danger");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    
    // Close mobile dropdown when menu is toggled
    if (isMobileDropdownOpen) {
      setIsMobileDropdownOpen(false);
    }
  };

  const toggleMobileDropdown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  return (
    <header className="border-bottom" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center py-2">
          <div className="navbar-brand">
            <h1 className="h5 m-0">Artist Search</h1>
          </div>

          <button 
            className="navbar-toggler d-md-none" 
            type="button" 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon">≡</span>
          </button>

          <div className="d-none d-md-flex align-items-center">
            <Link to="/">
              <button
                className={`btn me-2 ${currentPath === '/' ? '' : 'btn-outline-secondary'}`}
                style={currentPath === '/' ? { backgroundColor: '#0056b3', color: 'white', borderColor: '#070124' } : {border:'none'}}
                onClick={()=>localStorage.removeItem('currentPage')}
              >
                Search
              </button>
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/favorites">
                  <button
                    className={`btn me-2`}
                    style={currentPath === '/favorites' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Favorites
                  </button>
                </Link>
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {avatarUrl && (
                      <img
                        id="gravatar"
                        src={avatarUrl}
                        alt="User avatar"
                        className="rounded-circle me-2"
                        style={{ width: "30px", height: "30px", backgroundColor: "#d6d6a8" }}
                      />
                    )}
                    <span id="userName">{userName}</span>
                    <span className="ms-1">▼</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown" style={{ minWidth: "auto", padding: "0.5rem 0", margin: "0" }}>
                    <li><button className="dropdown-item text-danger" onClick={deleteAccount} style={{ padding: "0.25rem 1.5rem" }}>Delete account</button></li>
                    <li><button className="dropdown-item" onClick={logoutAccount} style={{ padding: "0.25rem 1.5rem" }}>Log out</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <div>
                <Link to="/login">
                  <button
                    className={`btn me-2`}
                    id='login'
                    style={currentPath === '/login' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Log in
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    className={`btn`}
                    id='register'
                    style={currentPath === '/register' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={`d-md-none collapse ${isMenuOpen ? 'show' : ''}`} id="mobileMenu">
          <div className="py-2">
            <Link to="/" className="d-block py-2" onClick={toggleMenu}>
              <button
                className={`btn w-100 text-start ${currentPath === '/' ? '' : 'btn-outline-secondary'}`}
                style={currentPath === '/' ? { backgroundColor: '#0056b3', color: 'white', borderColor: '#070124' } : {border:'none'}}
                onClick={()=>localStorage.removeItem('currentPage')}
              >
                Search
              </button>
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/favorites" className="d-block py-2" onClick={toggleMenu}>
                  <button
                    className={`btn w-100 text-start`}
                    style={currentPath === '/favorites' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Favorites
                  </button>
                </Link>
                
                <div className="position-relative py-2" ref={mobileDropdownRef}>
                  <button
                    className="btn d-flex align-items-center w-100 justify-content-between"
                    type="button"
                    onClick={toggleMobileDropdown}
                    aria-expanded={isMobileDropdownOpen ? "true" : "false"}
                  >
                    <div className="d-flex align-items-center">
                      {avatarUrl && (
                        <img
                          src={avatarUrl}
                          alt="User avatar"
                          className="rounded-circle me-2"
                          style={{ width: "30px", height: "30px", backgroundColor: "#d6d6a8" }}
                        />
                      )}
                      <span id="mobileUserName">{userName}</span>
                    </div>
                    <span className="ms-1">▼</span>
                  </button>
                  
                  {isMobileDropdownOpen && (
                    <div 
                      className="dropdown-menu w-100 show" 
                      style={{ 
                        position: 'absolute', 
                        border: '1px solid rgba(0,0,0,.15)',
                        borderRadius: '.25rem',
                        marginTop: '0.5rem',
                        padding: '0.5rem 0',
                        zIndex: 1000
                      }}
                    >
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={deleteAccount}
                        style={{ padding: "0.25rem 1.5rem" }}
                      >
                        Delete account
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={logoutAccount}
                        style={{ padding: "0.25rem 1.5rem" }}
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-2">
                <Link to="/login" className="d-block py-2" onClick={toggleMenu}>
                  <button
                    className={`btn w-100 text-start`}
                    id='mobile-login'
                    style={currentPath === '/login' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Log in
                  </button>
                </Link>
                <Link to="/register" className="d-block py-2" onClick={toggleMenu}>
                  <button
                    className={`btn w-100 text-start`}
                    id='mobile-register'
                    style={currentPath === '/register' ?
                      { backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' } :
                      { color: '#6c757d', backgroundColor: 'transparent', border: 'none' }
                    }
                  >
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="toast-container position-fixed top-3 end-0 p-3" style={{ zIndex: 1050, maxWidth: '210px', top: '70px', right: '10px', opacity: 0.8 }}>
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
              onClick={() => dismissToast(toast.id)} 
              aria-label="Close"
            />
          </div>
        ))}
      </div>
    </header>
  );
};

export default NavBar;