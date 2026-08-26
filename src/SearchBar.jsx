import { useState } from "react"
import { Link } from "react-router-dom"
import spotifyLogo from "./assets/spotify_logo.png"

function SearchBar(){
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState(null)
    const handleSearch = async (event) => {
        event.preventDefault()
        const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(searchTerm)}`)
        const data = await response.json()
        setSearchResults(data)
    }   
    const [selectedArtist, setSelectedArtist] = useState(null)  

    return(
        <section id="center">
            <div>
                <h1>Music Suggestion Tool</h1>
                <p>Find New music based on what you already love!</p>
                <p>Search for a song or artist</p>
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
                                   <Link to={`/track/${track.id}`}>
                                        {track.album.images[0] && (
                                            <img src={track.album.images[0].url} alt={track.album.name}/>
                                        )}
                                        <div>
                                            <p>{track.name}</p>
                                        </div>
                                    </Link>
                                    <a className="spotify-link" href ={track.external_urls.spotify} target="_blank" rel="noreferrer">
                                        <img src={spotifyLogo} alt="Open on Spotify" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {searchResults?.artists?.items?.length > 0 && (
                    <section className="artist">
                        <h2>Artists</h2>
                        <ul className="artist-results">
                            {searchResults?.artists?.items?.map((artist) => (
                                <li className="artist-card" key={artist.id}>
                                    <Link to={`/artist/${artist.id}`}>
                                        {artist.images[0] && (
                                            <img src={artist.images[0].url} alt={artist.name}/>
                                        )}
                                        <p>{artist.name}</p>
                                    </Link>
                                    <a className="spotify-link" href ={artist.external_urls.spotify} target="_blank" rel="noreferrer">
                                        <img src={spotifyLogo} alt="Open on Spotify" />
                                    </a>
                                </li>
                            ))}
                            {selectedArtist && (
                                <div className="selected-artist">
                                    <h2>Selected Artist</h2>
                                    <p>{selectedArtist.name}</p>
                                    <p>Spotify ID: {selectedArtist.id}</p>
                                </div>
                            )}
                        </ul>
                    </section>
                )}
            </div>
        </section>
    )
}

export default SearchBar