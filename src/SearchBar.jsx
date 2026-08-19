import { useState } from "react"

function SearchBar(){
      const [searchTerm, setSearchTerm] = useState("")
      const [submittedSearch, setSubmittedSearch] = useState("")
      const handleSearch = (event) => {event.preventDefault()
        setSubmittedSearch(searchTerm)}

        const songs = [
            {
                title: 'HUMBLE.',
                artist: 'Kendrick Lamar'
            },
            {
                title: 'Mr. T',
                artist: 'Westside Gunn'
            },
            {
                title: 'Black&Blue',
                artist: 'Vince Staples'
            },
        ]

        const filteredSongs = songs.filter((song) => {
            return song.title.toLowerCase().includes(submittedSearch.toLowerCase()) ||
            song.artist.toLowerCase().includes(submittedSearch.toLowerCase())
        })

    return(
        <>
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
                    {submittedSearch && (filteredSongs.length > 0 ? (
                        <ul>
                            {filteredSongs.map((song) => (
                                <li key={song.title}>
                                    {song.title} - {song.artist}
                                </li>
                            ))}
                        </ul>
                        ) : (
                        <p>No songs found</p>
                        )
                    )}
                </div>
            </section>
        </>
    )
}

export default SearchBar