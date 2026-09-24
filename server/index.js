import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors());
const PORT = 3000;
const cache = new Map();

const CACHE_TTL = 5 * 60 * 1000;

function getCached(cacheKey) {
    const cached = cache.get(cacheKey);

    if (!cached) {
        return null;
    }

    if (Date.now() >= cached.expiresAt) {
        cache.delete(cacheKey);
        return null;
    }

    return cached.data
}

function setCached(cacheKey, data, ttl = CACHE_TTL) {
    cache.set(cacheKey, {
        data: data,
        expiresAt: Date.now() + ttl
    });
}

async function promisePool(items, worker, concurrency = 3) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (true) {
            const currentIndex = nextIndex++;

            if (currentIndex >= items.length) {
                return;
            }

            try {
                results[currentIndex] = await worker(
                    items[currentIndex]
                );
            } catch (error) {
                console.error(error);
                results[currentIndex] = null;
            }
        }
    }

    const workers = [];
    const workerCount = Math.min(
        concurrency,
        items.length
    );

    for (let i = 0; i < workerCount; i++) {
        workers.push(runWorker());
    }

    await Promise.all(workers);

    return results;
}

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
    const cacheKey = `search-${query.toLowerCase()}`;
    const cached = getCached(cacheKey)
    if (cached) {
        return cached;
    }

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

    const data = {
        artists: artistData.artists,
        tracks: trackData.tracks
    };

    setCached(cacheKey, data);

    return data;
}

async function getArtist(token, artistID) {
    const cacheKey = `artist-${artistID}`;
    const cached = getCached(cacheKey)
    if (cached) {
        return cached;
    }

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
    setCached(cacheKey, data);

    return data;
}


async function getTrack(token, trackID) {
    const cacheKey = `track-${trackID}`;
    const cached = getCached(cacheKey)
    if (cached) {
        return cached;
    }

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

    setCached(cacheKey, data)

    return data;
}


async function getTrackRecommendations(token, track) {
    const cacheKey = `track-recommendations-${track.id}`;
    const cached = getCached(cacheKey)
    if (cached) {
        return cached;
    }

    const mainArtist = track.artists[0];
    const sameArtist = [];
    const otherArtists = [];

    const albumParams = new URLSearchParams({
        limit: "10",
        include_groups: "album,single"
    });

    const albumCacheKey = `artist-albums-${mainArtist.id}`
    let albumData = getCached(albumCacheKey)

    if (!albumData) {
        const albumResponse = await fetch(
            `https://api.spotify.com/v1/artists/${mainArtist.id}/albums?${albumParams}`,
            {
                headers: {"Authorization": `Bearer ${token}`}
            }
        );

        albumData = await albumResponse.json();

        if (!albumResponse.ok) {
            throw new Error(`Failed to get artist albums: ${JSON.stringify(albumData)}`);
        }

        setCached(albumCacheKey, albumData);
    }

    const albumsToCheck = albumData.items.slice(0, 5);

    const albumTrackResults = await promisePool(
        albumsToCheck,
        async (album) => {
            const cacheKey = `album-tracks-${album.id}`;
            const cached = getCached(cacheKey);
            if (cached) {
                return cached;
            }

            const trackResponse = await fetch(
                `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=2`,
                {
                    headers: {"Authorization": `Bearer ${token}`}
                }
            );

            const trackData = await trackResponse.json();

            if (!trackResponse.ok) {
                throw new Error(`Failed to get album tracks: ${JSON.stringify(trackData)}`);
            }

            setCached(cacheKey, trackData)

            return trackData;
        }, 3
    );

    for (let i = 0; i < albumsToCheck.length; i++) {
        const album = albumsToCheck[i]
        const trackData = albumTrackResults[i];

        if (!trackData) {
            continue;
        }

        for (const candidate of trackData.items) {
            if (candidate.id !== track.id) {
                sameArtist.push({
                    ...candidate,
                    album: album
                });
            }

            for (const artist of candidate.artists) {
                if (artist.id !== mainArtist.id) {
                    otherArtists.push(artist);
                }
            }
        }
    }


    const uniqueSameArtist = [
        ...new Map(sameArtist.map((candidate) => [candidate.id, candidate])).values()
    ];

    const uniqueOtherArtists = [
        ...new Map(otherArtists.map((artist) => [artist.id, artist])).values()
    ];

    const artistsToSearch = uniqueOtherArtists.slice(0, 5);
    
    const otherArtistResults = await promisePool(
        artistsToSearch,

        async (artist) => {
            const cacheKey = `artist-search-${artist.id}`;
            const cached = getCached(cacheKey);
            if (cached) {
                return cached;
            }

            const params = new URLSearchParams({
                q: `artist:${artist.name}`,
                type: "track",
                limit: "5"
            });

            const response = await fetch(
                `https://api.spotify.com/v1/search?${params}`,
                {
                    headers: {"Authorization": `Bearer ${token}`}
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Spotify track search failed: ${JSON.stringify(data)}`);
            }

            setCached(cacheKey, data.tracks.items);

            return data.tracks.items;
        }, 3
    );

    const otherArtistTracks = [];

    for (const tracks of otherArtistResults) {
        if (!tracks) {
            continue;
        }

        for (const candidate of tracks) {
            const belongsToMainArtist = candidate.artists.some((candidateArtist) => candidateArtist.id === mainArtist.id);

            if (!belongsToMainArtist) {
                otherArtistTracks.push(candidate)
            }
        }
    }

    const uniqueOtherArtistTracks = [
        ...new Map(otherArtistTracks.map((candidate) => [candidate.id, candidate])).values()
    ];

    const recommendations = {
        sameArtist: uniqueSameArtist.slice(0, 5),
        otherArtists: uniqueOtherArtistTracks.slice(0, 5)
    }

    setCached(cacheKey, recommendations);

    return recommendations;
}

async function getArtistRecommendations(token, artistID) {
    const cacheKey = `artist-recommendations-${artistID}`;
    const cached = getCached(cacheKey)
    if (cached) {
        return cached;
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

    const albumTrackResults = await promisePool(
        albumData.items.slice(0, 5),
        async (album) => {
            const trackResponse = await fetch(
                `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=10`,
                {
                    headers: {"Authorization": `Bearer ${token}`}
                }
            );

            const trackData = await trackResponse.json();

            if (!trackResponse.ok) {
                return [];
            }

            return trackData.items;
        }, 3
    );

    const artistIDs = [];

    for (const trackData of albumTrackResults) {
        for (const track of trackData) {
            for (const artist of track.artists) {
                if (artist.id !== artistID) {
                    artistIDs.push(artist.id);
                }
            }
        }
    }

    const uniqueArtistIDs = [...new Set(artistIDs)];

    const fullArtistResults = await promisePool(
        uniqueArtistIDs,
        async (artistID) => {
            return await getArtist(token, artistID);
        }, 3
    );

    for (const artist of fullArtistResults) {
        if (artist) {
            otherArtists.push(artist);
        }
    }

    const uniqueOtherArtists = [
        ...new Map(otherArtists.map((artist) => [artist.id, artist])).values()
    ];

    const recommendations = {
        artistAlbums: artistAlbums.slice(0, 5),
        otherArtists: uniqueOtherArtists.slice(0, 5)
    };

    setCached(cacheKey, recommendations);

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