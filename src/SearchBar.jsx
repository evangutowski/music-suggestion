import { useState } from "react"

function SearchBar(){
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState(null)
    const handleSearch = async (event) => {
        event.preventDefault()
        const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchTerm)}`)
        const data = await response.json()
        setSearchResults(data)
    }     

    return(
        <section id="center">
            <div>
                <p>
                    Search for a song or artist
                </p>
                <form onSubmit={handleSearch}>
                    <input
                    type="text"
                    className="search"
                    onChange={(event) => {setSearchTerm(event.target.value)}}>
                    </input>
                    <button type="submit">Search</button>
                </form>
                {searchResults?.tracks?.items?.length > 0 && (
                    <section className="tracks">
                        <h2>Tracks</h2>
                        <ul className="tracks-results">
                            {searchResults.tracks.items.map((track) => (
                                <li className="track-card" key={track.id}>
                                    <a href={track.external_urls.spotify} target="_blank" rel="noreferrer">
                                        {track.album.images[0] && (
                                            <img src={track.album.images[0].url} alt={track.album.name}/>
                                        )}
                                        <div>
                                            <p>{track.name}</p>
                                            <p>{track.artists.map((artist) => artist.name).join(", ")}</p>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="artist">
                    <h2>Artists</h2>
                    <ul className="artist-results">
                        {searchResults?.artists?.items?.map((artist) => (
                            <li className="artist-card" key={artist.id}>
                                <a href={artist.external_urls.spotify} target="_blank" rel="noreferrer">
                                    {artist.images[0] && (
                                        <img src={artist.images[0].url} alt={artist.name}/>
                                    )}
                                    <p>{artist.name}</p>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </section>
    )
}

export default SearchBar