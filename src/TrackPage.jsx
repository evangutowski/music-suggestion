import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import spotifyLogo from "./assets/spotify_logo.png";


function TrackPage() {
    const { id } = useParams();
    const [track, setTrack] = useState(null);

    useEffect(() => {
        async function fetchTrack() {
            const response = await fetch(`http://localhost:3000/api/track/${id}`);
            const data = await response.json();
            if (!response.ok){
                console.error("Track request failed:", data);
                return;
            }
            setTrack(data);            
        }

        fetchTrack();
    }, [id]);

    if (!track) {
        return <p>Loading...</p>
    }

    return (
        <section id="center">
            <div className="track-page-card">
                <h2>{track.name}</h2>
                {track.album?.images?.[0] && (
                    <img src={track.album.images[0].url} alt={track.album.name} />
                )}
                <p>{track.artists?.map((artist) => artist.name).join(", ")}</p>
                <a className="spotify-link" href ={track.external_urls.spotify} target="_blank" rel="noreferrer">
                    <img src={spotifyLogo} alt="Open on Spotify" />
                </a>
            </div>
        </section>
    );
}

export default TrackPage;