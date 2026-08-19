import { useState } from "react"

function SearchBar(){
      const [searchTerm, setSearchTerm] = useState("")
      const handleSearch = (event) => {event.preventDefault()
        console.log(searchTerm)}

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
                </div>
            </section>
        </>
    )
}

export default SearchBar