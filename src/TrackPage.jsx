import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import spotifyLogo from "./assets/spotify_logo.png";
import { Link } from "react-router-dom"


function TrackPage() {
    const { id } = useParams();
    const [track, setTrack] = useState(null);
    const [recommendations, setRecommendations] = useState({sameArtist: [], otherArtists: []});

    useEffect(() => {
        async function fetchTrack() {
            const response = await fetch(`http://localhost:3000/api/track/${id}`);
            const data = await response.json();
            
            if (!response.ok){
                console.error("Track request failed:", data);
                return;
            }
            setTrack(data);   
            
            const recommendationResponse = await fetch(`http://localhost:3000/api/recommendations/track/${id}`);
            
            const recommendationData = await recommendationResponse.json();
            
            if (!recommendationResponse.ok) {
                console.error("Recommendation request failed:", recommendationData);
                return;
            }       
            setRecommendations(recommendationData)
        }

        fetchTrack();
    }, [id]);

    if (!track) {
        return <p>Loading...</p>
    }

    return (
        <section id="center">
            <h2 style={{ marginTop: '20px' }}>Your Selected Song:</h2>
            <div className="track-page-card">
                <h2>{track.name}</h2>
                {track.album?.images?.[0] && (
                    <img src={track.album.images[0].url} alt={track.album.name} />
                )}
                <p>{track.artists?.map((artist) => artist.name).join(", ")}</p>
                <a className="spotify-link" href={track.external_urls.spotify} target="_blank" rel="noreferrer">
                    <img src={spotifyLogo} alt="Open on Spotify" />
                </a>
            </div>

            <section className="tracks">
                <h2>More from {track.artists[0].name}:</h2>
                <ul className="tracks-results">
                    {recommendations.sameArtist.map((recommendation) => (
                        <li className="track-card" key={recommendation.id}>
                            <Link to={`/track/${recommendation.id}`}>
                                <p>{recommendation.name}</p>
                                {recommendation.album?.images?.[0] && (
                                    <img src={recommendation.album.images[0].url} alt={recommendation.album.name} />
                                )}
                                <p>{recommendation.artists?.map((artist) => artist.name).join(", ")}</p>
                            </Link>
                            <a className="spotify-link" href={recommendation.external_urls.spotify} target="_blank" rel="noreferrer">
                                <img src={spotifyLogo} alt="Open on Spotify" />
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="track-section">
                <h2>From Other Artists:</h2>
                <ul className="tracks-results">
                    {recommendations.otherArtists.map((recommendation) => (
                        <li className="track-card" key={recommendation.id}>
                            <Link to={`/track/${recommendation.id}`}>
                                <p>{recommendation.name}</p>
                                {recommendation.album?.images?.[0] && (
                                    <img src={recommendation.album.images[0].url} alt={recommendation.album.name} />
                                )}
                                <p>{recommendation.artists?.map((artist) => artist.name).join(", ")}</p>
                            </Link>
                            <a className="spotify-link" href={recommendation.external_urls.spotify} target="_blank" rel="noreferrer">
                                <img src={spotifyLogo} alt="Open on Spotify" />
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </section>
    );
}

export default TrackPage;