import React from 'react';


const Footer = () => {
    return (
        <footer className="text-white text-center py-2 fixed-bottom w-100" style={{ zIndex: 1000 }}>
            <style>
                {`
                    footer {
                        position: relative;
                        bottom: 0;
                        width: 100%;
                        background-color:rgb(3, 63, 128);
                        color: white;
                    }
                    .container a {
                        color: white;
                        text-decoration: none;
                    }
                    .container a:hover {
                        text-decoration: underline;
                    }
                `}
            </style>
            <div className="container">
                <a href="https://www.artsy.net/" className="text-white text-decoration-none">
                    Powered by <img src='artsy_logo.svg' width="20" alt="Artsy Logo" /> Artsy
                </a>
            </div>
        </footer>
    );
};

export default Footer;

