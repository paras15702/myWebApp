const express = require('express');
const cors = require('cors');
const { MongoClient } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require('crypto');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const axios = require('axios');
require('dotenv').config();



app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-XAPP-Token']
}));

app.use(express.json());



app.use((req, res, next) => {

    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-XAPP-Token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Max-Age', '86400');


    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

const bcrypt = require("bcrypt");
app.use(cookieParser());
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);



app.get('/artists', async (req, res) => {
    try {

        let token = req.headers['x-xapp-token'];


        if (!token) {
            try {
                const clientId = process.env.CLIENT_ID;
                const clientSecret = process.env.CLIENT_SECRET;

                if (!clientId || !clientSecret) {
                    return res.status(500).json({ msg: 'API credentials not configured' });
                }

                const url = `https://api.artsy.net/api/tokens/xapp_token?client_id=${clientId}&client_secret=${clientSecret}`;


                const tokenResponse = await axios.post(url);
                token = tokenResponse.data.token;

                if (!token) {
                    return res.status(401).json({ msg: 'Failed to obtain authentication token' });
                }
            } catch (error) {
                console.error('Error getting token:', error.message);
                return res.status(500).json({ msg: 'Error occurred while authenticating' });
            }
        }


        const query = req.query.name;

        if (!query) {
            return res.status(400).json({ msg: 'Artist name query parameter is required' });
        }


        const artistResponse = await axios.get(`https://api.artsy.net/api/search?q=${encodeURIComponent(query)}&type=artist&size=10`, {
            headers: {
                'X-XAPP-Token': token
            }
        });


        if (artistResponse.status !== 200) {
            return res.status(artistResponse.status).json({
                msg: `Artsy API responded with status ${artistResponse.status}`
            });
        }

        return res.json(artistResponse.data);

    } catch (err) {
        console.error('Error fetching artists:', err);
        return res.status(500).json({
            msg: 'Internal Server Error',
            error: err.message
        });
    }
});




app.get('/artist/:id', async (req, res) => {

    const headers = req.headers['x-xapp-token'];

    const id = req.params.id;
    try {
        const response = await fetch(`https://api.artsy.net/api/artists/${id}`, {
            method: 'GET',
            headers: {
                'X-XAPP-Token': headers
            }
        });
        const data = await response.json();


        res.json(data);


    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

app.get('/artwork', async (req, res) => {

    const headers = req.headers['x-xapp-token'];

    const artist_id = req.query.artist_id;
    try {
        const response = await fetch(`https://api.artsy.net/api/artworks?artist_id=${artist_id}&size=10`, {
            method: 'GET',
            headers: {
                'X-XAPP-Token': headers
            }
        });
        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

app.get('/genes', async (req, res) => {

    const headers = req.headers['x-xapp-token'];
    const artwork_id = req.query.artwork_id;
    try {
        const response = await fetch(`https://api.artsy.net/api/genes?artwork_id=${artwork_id}`, {
            method: 'GET',
            headers: {
                'X-XAPP-Token': headers
            }
        });
        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

app.get('/similarto', async (req, res) => {

    const headers = req.headers['x-xapp-token'];

    const artist_id = req.query.artist_id;
    try {
        const response = await fetch(`https://api.artsy.net/api/artists?similar_to_artist_id=${artist_id}`, {
            method: 'GET',
            headers: {
                'X-XAPP-Token': headers
            }
        });
        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("users");


        const usersCollection = db.collection("users");
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("Ensured unique index on email field");

        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

app.post('/addUser', async (req, res) => {


    const { name, email, password } = req.body;

    try {
        const db = await connectDB();
        const usersCollection = db.collection("users");


        const hashedPassword = await bcrypt.hash(password, 10);


        const result = await usersCollection.insertOne({
            name,
            email,
            password: hashedPassword,
        });


        console.log("User registered:", result.insertedId);
        res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
    }


})

app.post('/checkEmail', async (req, res) => {
    try {
        const { email } = req.body;
        const db = await connectDB();
        const usersCollection = db.collection("users");

        const existingUser = await usersCollection.findOne({ email });


        res.json({ exists: !!existingUser });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/loginUser', async (req, res) => {



    try {
        const { email, password } = req.body;

        const db = await connectDB();
        const usersCollection = db.collection("users");


        const user = await usersCollection.findOne({ email });
        console.log(user);
        if (!user) {

            return res.status(404).json({ message: "User not found" });
        }


        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }


        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, "webTECHHW2", { expiresIn: "1h" });

        console.log("Token generated:", token);


        res.cookie("authToken", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: "/",
            maxAge: 60 * 60 * 1000,
        });




        console.log("User logged in:", user.email);

        res.status(200).json({ message: "Login successful", token: token });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Server error" });
    }

})

app.post('/addToFavorites', async (req, res) => {
    console.log("addToFavorites");
    const { artistId, artistName, artistImage, addedAt, birthday, deathday, nationality, biography } = req.body;
    console.log(req.cookies);
    try {

        const token = req.cookies.authToken;
        console.log("token", token);
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }


        let decodedToken;
        try {
            decodedToken = jwt.verify(token, "webTECHHW2");
            console.log("decodedToken", decodedToken);
        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.id;


        const db = await connectDB();
        const favoritesCollection = db.collection("favorites");


        const favorite = await favoritesCollection.findOne({ userId, artistId });

        if (favorite) {

            await favoritesCollection.deleteOne({ userId, artistId });
            console.log("Artist removed from favorites:", artistId);
            res.status(200).json({ message: "Artist removed from favorites" });
        } else {

            const result = await favoritesCollection.insertOne({
                userId,
                artistId,
                artistName,
                artistImage,
                addedAt: addedAt || new Date(),
                birthday: birthday || null,
                deathday: deathday || null,
                nationality: nationality || null,
                biography: biography || null
            });

            console.log("Artist added to favorites:", result.insertedId);
            res.status(200).json({ message: "Artist added to favorites" });
        }
    } catch (error) {
        console.error("Error adding artist to favorites:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get('/getFavorites', async (req, res) => {

    try {

        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }


        let decodedToken;
        try {
            decodedToken = jwt.verify(token, "webTECHHW2");
        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.id;


        const db = await connectDB();
        const favoritesCollection = db.collection("favorites");


        const favorites = await favoritesCollection.find({ userId }).toArray();

        console.log("User favorites:", favorites);
        res.status(200).json(favorites);
    } catch (error) {
        console.error("Error getting favorites:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/verifyToken", (req, res) => {


    let token = req.cookies.authToken;


    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, "webTECHHW2");
        res.status(200).json({ message: "Token is valid", userId: decoded.id, name: decoded.name, email: decoded.email });
    } catch (error) {
        console.error("Invalid token:", error.message);
        res.status(401).json({ message: "Invalid or expired token" });
    }
});

app.delete("/deleteAccount", async (req, res) => {

    try {
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }


        let decodedToken;
        try {
            decodedToken = jwt.verify(token, "webTECHHW2");
        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.id;
        const email = decodedToken.email;

        const db = await connectDB();
        const usersCollection = db.collection("users");
        const favoritesCollection = db.collection("favorites");


        await usersCollection.deleteOne({ email: email });
        await favoritesCollection.deleteMany({ userId });



        res.cookie("authToken", "", {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: "/",
            maxAge: 0,
            expires: new Date(0)
        });





        console.log("User account deleted:", userId);
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Server error" });
    }
});



app.post("/logout", (req, res) => {

    res.cookie("authToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: "/",
        maxAge: 0,
        expires: new Date(0)
    });



    res.status(200).json({ message: "Logged out successfully" });
});

app.get('/getGravatar', (req, res) => {

    function getGravatarUrl(email, size = 80) {
        const trimmedEmail = email.trim().toLowerCase();
        const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');

        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;

    }

    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const gravatarUrl = getGravatarUrl(email, 80);
    console.log("Gravatar URL:", gravatarUrl);
    res.status(200).json({ gravatarUrl });




});


app.delete('/removeFavorites', async (req, res) => {
    try {
        const { id } = req.query;

        console.log("deleteFavorites", id);
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }


        let decodedToken;
        try {
            decodedToken = jwt.verify(token, "webTECHHW2");
        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.id;


        const db = await connectDB();
        const favoritesCollection = db.collection("favorites");


        await favoritesCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });

        console.log("Artist removed from favorites:", id);
        res.status(200).json({ message: "Artist removed from favorites" });
    } catch (error) {
        console.error("Error deleting artist from favorites:", error);
        res.status(500).json({ message: "Server error" });
    }
})

app.post('/getToken', async (req, res) => {
    try {
        const clientId = process.env.CLIENT_ID;
        console.log(clientId);
        const clientSecret = process.env.CLIENT_SECRET;


        const url = `https://api.artsy.net/api/tokens/xapp_token?client_id=${clientId}&client_secret=${clientSecret}`;

        const response = await axios.post(url);
        const data = response.data;

        console.log(data, 'data');
        console.log(typeof data);
        console.log("sdkjhk");

        return res.json(data);
    } catch (error) {
        console.error('Error:', error.message);
        return res.json({ msg: 'Error occurred while fetching data' });
    }
});




const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

