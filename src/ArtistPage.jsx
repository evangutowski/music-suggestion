import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import spotifyLogo from "./assets/spotify_logo.png";


function ArtistPage() {
    const { id } = useParams();
    const [artist, setArtist] = useState(null);

    useEffect(() => {
        async function fetchArtist() {
            const response = await fetch(`http://localhost:3000/api/artist/${id}`);
            const data = await response.json();
            if (!response.ok){
                console.error("Artist request failed:", data);
                return;
            }
            setArtist(data);            
        }

        fetchArtist();
    }, [id]);

    if (!artist) {
        return <p>Loading...</p>
    }

    return (
        <section id="center">
            <div className="artist-page-card">
                <h2>{artist.name}</h2>
                {artist.images?.[0] && (
                    <img src={artist.images[0].url} alt={artist.name} />
                )}
                <a className="spotify-link" href ={artist.external_urls.spotify} target="_blank" rel="noreferrer">
                    <img src={spotifyLogo} alt="Open on Spotify" />
                </a>
            </div>
        </section>
    );
}

export default ArtistPage;