import { ReactNode, useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isLoggedIn } = useContext(AuthContext) as AuthContextType;

  
  return isLoggedIn ? <>{children}</> : <Navigate to="/" />;
};

export default PrivateRoute;