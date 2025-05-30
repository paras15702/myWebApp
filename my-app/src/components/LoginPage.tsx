import React, { useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface AuthContextType {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

interface EmailCheckResponse {
  exists: boolean;
  error: string | null;
}

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const { setIsLoggedIn } = useContext(AuthContext) as AuthContextType;
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const navigate = useNavigate();

    const checkEmailExists = async (email: string): Promise<EmailCheckResponse> => {
        try {
            const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/checkEmail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            return { exists: data.exists, error: null };
        } catch (error) {
            console.error("Error checking email:", error);
            return { exists: false, error: (error as Error).message };
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');

        // Validate
        let isValid = true;

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Email must be valid.");
            isValid = false;
        }

        if (!password) {
            setPasswordError("Password is required.");
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const { exists, error } = await checkEmailExists(email);

        if (error) {
            alert("Error checking email: " + error);
            return;
        }

        if (!exists) {
            setEmailError("User does notexists.");
            return;
        }

        try {
            const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/loginUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json()
                
                console.log("Login successful!");
                if (data.token) {
            localStorage.setItem('authToken', data.token);
        }
                setIsLoggedIn(true);
                navigate("/");
            } else {
                setPasswordError("Email or password is wrong")
            }
        } catch (error) {
            console.error("Error during login:", error);
        }
    }

    return (
        <div style={{marginLeft:'15%',marginRight:'15%'}}>
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card mt-5">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">Login</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email address</label>
                                    <input
                                        type="email"
                                        className={`form-control ${emailError ? 'is-invalid' : ''}`}
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {emailError && (
                                        <div className="invalid-feedback">
                                            {emailError}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {passwordError && (
                                        <div className="invalid-feedback">
                                            {passwordError}
                                        </div>
                                    )}
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary py-2" style={{ backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' }}>Log in</button>
                                </div>
                            </form>

                            <div className="text-center mt-3" >
                                <span>Don't have an account yet? </span>
                                <Link to="/register" className="text-primary">Register</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;