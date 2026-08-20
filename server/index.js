import dotenv from "dotenv";
import express from "express";
dotenv.config();
const app = express();
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
        type: "artist"
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

app.get("/api/search", async (req, res) => {
    const token = await getSpotifyToken();
    const query = req.query.q;
    const data = await searchSpotify(token, query);
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});