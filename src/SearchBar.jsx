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
                    <ul>                            
                        {searchResults?.artists?.items?.map((artist) => (
                            <li key={artist.id}>
                                {artist.name}
                            </li>
                        ))}
                    </ul>                    
                </div>
            </section>
    )
}

export default SearchBar