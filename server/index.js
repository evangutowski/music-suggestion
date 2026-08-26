import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors());
const PORT = 3000;

async function getSpotifyToken() {
    const credentials = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({
                grant_type: "client_credentials"
            })
        }
    );

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`Spotify authentication failed: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}


async function searchSpotify(token, query) {
    const params = new URLSearchParams({
        q: query,
        type: "artist,track"
    });

    const url = `https://api.spotify.com/v1/search?${params}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {"Authorization": `Bearer ${token}`}
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Spotify search failed: ${JSON.stringify(data)}`);
    }

    return data;
}


async function getArtist(token, artistID) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistID}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Spotify artist request failed: ${JSON.stringify(data)}`);
    }

    return data;
}


async function getTrack(token, trackID) {
    const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackID}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Spotify track request failed: ${JSON.stringify(data)}`);
    }

    return data;
}


app.get("/api/search", async (req, res) => {
    const token = await getSpotifyToken();
    const query = req.query.q;
    const data = await searchSpotify(token, query);
    res.json(data);
});

app.get("/api/artist/:id", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const artist = await getArtist(token, req.params.id);
        res.json(artist);
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get artist" });
    }
});

app.get("/api/track/:id", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const track = await getTrack(token, req.params.id);
        res.json(track);
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get artist" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});