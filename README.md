# Music Suggestion Tool

A full-stack music discovery application built with React, Vite, Node.js, Express, and the Spotify Web API.

The application allows users to search for songs and artists, explore artist and track pages, view albums, and discover music from related artists.

## Features

- Search for songs and artists using Spotify
- View detailed artist pages
- View detailed track pages
- Explore albums from an artist
- Discover other artists
- Get additional songs from a selected artist
- Get song recommendations from other artists
- Open songs and artists directly in Spotify
- Cached recommendation results to reduce unnecessary Spotify API requests

## Technologies

- React
- Vite
- JavaScript
- Node.js
- Express
- Spotify Web API
- React Router
- CSS

## Prerequisites

Before running the application, make sure you have:

- Node.js installed
- npm installed
- A Spotify Developer account

## Installation

### 1. Clone the repository

    git clone https://github.com/evangutowski/music-suggestion.git
    cd music-suggestion

### 2. Install frontend dependencies

From the project root:

    npm install

### 3. Install backend dependencies

Move into the server directory:

    cd server
    npm install
    cd ..

### 4. Set up Spotify API credentials

Create an application through the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

You will need your:

- Spotify Client ID
- Spotify Client Secret

Create a `.env` file inside the `server` directory:

    SPOTIFY_CLIENT_ID=your_client_id
    SPOTIFY_CLIENT_SECRET=your_client_secret

Replace the values with your own Spotify credentials.

**Do not commit your `.env` file to GitHub.**

## Running the Application

The frontend and backend need to run separately.

### 1. Start the backend

Open a terminal and run:

    cd server
    node index.js

The backend will run at:

    http://localhost:3000

### 2. Start the frontend

Open a second terminal from the project root and run:

    npm run dev

Vite will provide a local development URL, typically:

    http://localhost:5173

Open the Vite address in the browser of your choosing.

## How to Use

1. Search for a song or artist.
2. Select a track to open its track page.
3. Explore additional songs from the selected artist.
4. Explore songs from other artists.
5. Select an artist to open their artist page.
6. View albums from the selected artist.
7. Explore other artists related to the selected artist.
8. Use the Spotify icon to open the selected song or artist directly in Spotify.


## Notes

This application uses the Spotify Web API to retrieve music and artist information.

Anyone running the application locally should create their own Spotify Developer credentials. API credentials should never be committed to the repository.

The application currently runs locally with a React/Vite frontend and a Node.js/Express backend.
