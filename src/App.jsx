import './App.css'
import SearchBar from './SearchBar'

function App() {

  return (
    <>
      <section id="center">
        <div>
          <h1>Music Suggestion Tool</h1>
          <p>
            Find new music based on what you already love.
          </p>
          <SearchBar />
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
