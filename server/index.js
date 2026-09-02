import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors());
const PORT = 3000;
const cache = new Map();
const CACHE_TIME = 10 * 60 * 1000;

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
    const artistParams = new URLSearchParams({
        q: query,
        type: "artist"
    });

    const trackParams = new URLSearchParams({
        q: query,
        type: "track"
    });

    const artistResponse = await fetch(
        `https://api.spotify.com/v1/search?${artistParams}`,
        {
            method: "GET",
            headers: {"Authorization": `Bearer ${token}`}
        }
    );

    const trackResponse = await fetch(
        `https://api.spotify.com/v1/search?${trackParams}`,
        {
            method: "GET",
            headers: {"Authorization": `Bearer ${token}`}
        }
    );

    const artistData = await artistResponse.json();
    const trackData = await trackResponse.json();

    if (!artistResponse.ok) {
        throw new Error(
            `Spotify artist search failed: ${JSON.stringify(artistData)}`
        );
    }

    if (!trackResponse.ok) {
        throw new Error(
            `Spotify track search failed: ${JSON.stringify(trackData)}`
        );
    }

    return {
        artists: artistData.artists,
        tracks: trackData.tracks
    };
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


async function getTrackRecommendations(token, track) {
    const cacheKey = `track-recommendations-${track.id}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.time < CACHE_TIME) {
            return cached.data;
        }

        cache.delete(cacheKey);
    }

    const mainArtist = track.artists[0];
    const sameArtist = [];
    const otherArtists = [];

    const albumParams = new URLSearchParams({
        limit: "10",
        include_groups: "album,single"
    });

    const albumResponse = await fetch(
        `https://api.spotify.com/v1/artists/${mainArtist.id}/albums?${albumParams}`,
        {
            headers: {"Authorization": `Bearer ${token}`}
        }
    );

    const albumData = await albumResponse.json();

    if (!albumResponse.ok) {
        throw new Error(
            `Failed to get artist albums: ${JSON.stringify(albumData)}`
        );
    }

    for (const album of albumData.items.slice(0, 5)) {
        const trackResponse = await fetch(
            `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=2`,
            {
                headers: {"Authorization": `Bearer ${token}`}
            }
        );

        const trackData = await trackResponse.json();
        if (!trackResponse.ok) {
            continue;
        }

        for (const candidate of trackData.items) {
            if (candidate.id !== track.id) {sameArtist.push({...candidate,album: album});
            }

            for (const artist of candidate.artists) {
                if (artist.id !== mainArtist.id) {otherArtists.push(artist);}
            }
        }
    }

    const uniqueSameArtist = [
        ...new Map(sameArtist.map((candidate) => [candidate.id, candidate])).values()
    ];

    const uniqueOtherArtists = [
        ...new Map(otherArtists.map((artist) => [artist.id, artist])).values()
    ];

    const otherArtistTracks = [];

    for (const artist of uniqueOtherArtists.slice(0, 5)) {
        const params = new URLSearchParams({q: `artist:${artist.name}`, type: "track", limit: "5"});

        const response = await fetch(
            `https://api.spotify.com/v1/search?${params}`,
            {
                headers: {"Authorization": `Bearer ${token}`}
            }
        );

        const data = await response.json();

        if (!response.ok) {
            continue;
        }

        for (const candidate of data.tracks.items) {
            if (candidate.artists.some(
                (candidateArtist) => candidateArtist.id === mainArtist.id)) {continue;}

            otherArtistTracks.push(candidate);
        }
    }

    const uniqueOtherArtistTracks = [
        ...new Map(otherArtistTracks.map((candidate) => [candidate.id, candidate])).values()
    ];

    const recommendations = {
        sameArtist: uniqueSameArtist.slice(0, 5),
        otherArtists: uniqueOtherArtistTracks.slice(0, 5)
    }

    cache.set(cacheKey, {
        data: recommendations,
        time: Date.now()
    });

    return recommendations;
}

async function getArtistRecommendations(token, artistID) {
    const cacheKey = `artist-recommendations-${artistID}`;

    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);

        if (Date.now() - cached.time < CACHE_TIME) {
            return cached.data;
        }

        cache.delete(cacheKey);
    }  

    const artistAlbums = [];
    const otherArtists = [];
    const albumParams = new URLSearchParams({
        limit: "5",
        include_groups: "album"
    });

    const albumResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistID}/albums?${albumParams}`,
        {
            headers: {"Authorization": `Bearer ${token}`}
        }
    );

    const albumData = await albumResponse.json();
    if (!albumResponse.ok) {
        throw new Error(
            `Failed to get artist albums: ${JSON.stringify(albumData)}`
        );
    }

    artistAlbums.push(...albumData.items);

    for (const album of albumData.items.slice(0, 5)) {
        const trackResponse = await fetch(
            `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=10`,
            {
                headers: {"Authorization": `Bearer ${token}`}
            }
        );

        const trackData = await trackResponse.json();

        if (!trackResponse.ok) {
            continue;
        }

        for (const track of trackData.items) {
            for (const artist of track.artists) {
                if (artist.id !== artistID) {
                    const fullArtist = await getArtist(token, artist.id)
                    otherArtists.push(fullArtist);
                }
            }
        }
    }

    const uniqueOtherArtists = [
        ...new Map(otherArtists.map((artist) => [artist.id, artist])).values()
    ];

    const recommendations = {
        artistAlbums: artistAlbums.slice(0, 5),
        otherArtists: uniqueOtherArtists.slice(0, 5)
    };

    cache.set(cacheKey, {
        data: recommendations,
        time: Date.now()
    });

    return recommendations;
}

app.get("/api/search", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const query = req.query.q;

        if (!query || !query.trim()) {
            return res.status(400).json({
                error: "Search query is required"
            });
        }

        const data = await searchSpotify(token, query.trim());

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to search Spotify"
        });
    }
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
        res.status(500).json({ error: "Failed to get track" });
    }
});

app.get("/api/track-page/:id", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const track = await getTrack(
            token,
            req.params.id
        );

        const recommendations = await getTrackRecommendations(
            token,
            track
        );

        res.json({
            track: track,
            recommendations: recommendations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to load track page"
        });
    }
});

app.get("/api/artist-page/:id", async (req, res) => {
    try {
        const token = await getSpotifyToken();
        const artist = await getArtist(token, req.params.id);
        
        const recommendations = await getArtistRecommendations(
            token,
            artist.id
        );

        res.json({
            artist: artist,
            albums: recommendations.artistAlbums,
            otherArtists: recommendations.otherArtists
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to load artist page"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});