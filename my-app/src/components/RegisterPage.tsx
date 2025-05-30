import React, { useState, useContext, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";

interface EmailCheckResponse {
  exists: boolean;
  error: string | null;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [nameError, setNameError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { setIsLoggedIn } = useContext(AuthContext) as AuthContextType;
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
            return { exists: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        
        setNameError('');
        setEmailError('');
        setPasswordError('');

        
        let isValid = true;

        if (!name) {
            setNameError('Fullname is required.');
            isValid = false;
        }

        if (!email) {
            setEmailError('Email must be valid.');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Email must be valid.');
            isValid = false;
        }

        if (!password) {
            setPasswordError('Password is required.');
            isValid = false;
        }

        if (!isValid) {
            setIsSubmitting(false);
            return;
        }

       
        const { exists, error } = await checkEmailExists(email);

        if (error) {
            alert("Error checking email: " + error);
            setIsSubmitting(false);
            return;
        }

        if (exists) {
            setEmailError("User with this email already exists.");
            setIsSubmitting(false);
            return;
        }

        
        try {
            const response = await fetch("https://webtechhw3-456400.ue.r.appspot.com/addUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
                try {
                    const loginResponse = await fetch("https://webtechhw3-456400.ue.r.appspot.com/loginUser", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ email, password }),
                    });

                    if (loginResponse.ok) {
                        localStorage.clear()
                        setIsLoggedIn(true);

                        navigate("/");
                    } else {
                        alert("Login failed!");
                    }
                } catch (error) {
                    console.error("Error during login:", error);
                }
            } else {
                const data = await response.json();
                alert("Registration failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error during registration:", error);
            alert("Registration error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-5" style={{marginLeft:'12%',marginRight:'12%'}}>
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card border-light shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="mb-4">Register</h2>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Fullname</label>
                                    <div className="position-relative">
                                        <input
                                            type="text"
                                            className={`form-control ${nameError ? 'is-invalid' : ''}`}
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                        />
                                        {nameError && (
                                            <div className="invalid-feedback">
                                                {nameError}
                                            </div>
                                        )}
                                        {nameError && (
                                            <span className="position-absolute top-50 end-0 translate-middle-y text-danger pe-2">
                                                <i className="bi bi-exclamation-circle"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email address</label>
                                    <div className="position-relative">
                                        <input
                                            type="email"
                                            className={`form-control ${emailError ? 'is-invalid' : ''}`}
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email"
                                        />
                                        {emailError && (
                                            <div className="invalid-feedback">
                                                {emailError}
                                            </div>
                                        )}
                                        {emailError && (
                                            <span className="position-absolute top-50 end-0 translate-middle-y text-danger pe-2">
                                                <i className="bi bi-exclamation-circle"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                    />
                                    {passwordError && (
                                        <div className="invalid-feedback">
                                            {passwordError}
                                        </div>
                                    )}
                                </div>

                                <div className="d-grid gap-2 mb-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary py-2"
                                        disabled={isSubmitting}
                                        style={{ backgroundColor: '#0056b3', color: 'white', borderColor: '#0056b3' }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Registering...
                                            </>
                                        ) : "Register"}
                                    </button>
                                </div>
                            </form>

                            <div className="text-center mt-3">
                                <span>Already have an account? </span>
                                <Link to="/login" className="text-primary">Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;