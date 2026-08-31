import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import spotifyLogo from "./assets/spotify_logo.png";
import { Link } from "react-router-dom"


function ArtistPage() {
    const { id } = useParams();
    const [artist, setArtist] = useState(null);
    const [recommendations, setRecommendations] = useState({albums: [], otherArtists: []});

    useEffect(() => {
        async function fetchArtist() {
            const response = await fetch(`http://localhost:3000/api/artist/${id}`);
            const data = await response.json();
            if (!response.ok){
                console.error("Artist request failed:", data);
                return;
            }
            setArtist(data);   
            
            const recommendationResponse = await fetch(`http://localhost:3000/api/recommendations/artist/${id}`);

            const recommendationData = await recommendationResponse.json();
            console.log("Artist recommendations: ", recommendationData)

            if (!recommendationResponse.ok) {
                console.error("Recommendation request failed: ", recommendationData);
                return;
            }
            setRecommendations(recommendationData)
        }

        fetchArtist();
    }, [id]);

    if (!artist) {
        return <p>Loading...</p>
    }

    return (
        <section id="center">
            <h2 style={{ marginTop: '20px' }}> Your Selected Artist:</h2>
            <div className="artist-page-card">
                <h2>{artist.name}</h2>
                {artist.images?.[0] && (
                    <img src={artist.images[0].url} alt={artist.name} />
                )}
                <a className="spotify-link" href ={artist.external_urls.spotify} target="_blank" rel="noreferrer">
                    <img src={spotifyLogo} alt="Open on Spotify" />
                </a>
            </div>

            <section className="albums">
                <h2>More from {artist.name}:</h2>
                <ul className="album-results">
                    {recommendations.albums.map((album) => (
                        <li className="album-card" key={album.id}>
                            <Link to={`/track/${album.id}`}>
                                <p>{album.name}</p>
                                {album.images?.[0] && (
                                    <img src={album.images[0].url} alt={album.name} />
                                )}
                                <p>{album.artists?.map((artist) => artist.name).join(", ")}</p>
                            </Link>
                            <a className="spotify-link" href={album.external_urls.spotify} target="_blank" rel="noreferrer">
                                <img src={spotifyLogo} alt="Open on Spotify" />
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="artist-section">
                <h2>Other Artists:</h2>
                <ul className="artist-results">
                    {recommendations.otherArtists.map((recommendation) => (
                        <li className="artist-card" key={recommendation.id}>
                            <Link to={`/artist/${recommendation.id}`}>
                                <p>{recommendation.name}</p>
                                {recommendation.images?.[0] && (
                                    <img src={recommendation.images[0].url} alt={recommendation.name} />
                                )}
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

export default ArtistPage;