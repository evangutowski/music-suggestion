import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


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
        <section>
            <h1>{artist.name}</h1>
            {artist.images?.[0] && (
                <img src={artist.images[0].url} alt={artist.name} />
            )}
            <p>{artist.genres?.join(", ")}</p>
        </section>
    );
}

export default ArtistPage;