import './App.css'
import SearchBar from './SearchBar'
import ArtistPage from './ArtistPage'
import TrackPage from './TrackPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<SearchBar />} />
          <Route path='/artist/:id' element={<ArtistPage />} />
          <Route path='/track/:id' element={<TrackPage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App
