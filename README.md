# 🌦️ AeroView: Advanced Weather Dashboard

AeroView is a polished full-stack weather intelligence dashboard built with a **React + Vite frontend** and an **Express + MongoDB backend**. It tracks multiple cities, fetches live weather and air-quality telemetry, and renders the data through an atmospheric UI with dynamic themes, canvas effects, and analytics charts.

## ✨ Highlights

- 🔭 Multi-city weather tracking with active city switching
- 🌈 Dynamic theme system that reacts to weather conditions
 - ⚙️ Light-theme default with quick toggle; theme persists in localStorage
- 📊 Rich telemetry panels for temperature, wind, humidity, pressure, UV, and AQI
- 🎨 Glassmorphism UI with animated weather atmosphere background
 - 🎛️ Canvas backdrop with toggle, FPS cap and prefers-reduced-motion support (pauses on background tabs)
- 🛰️ Backend weather aggregation with caching and offline mock fallback
- ⚡ Fast local development with Vite and Express
- 🧠 MongoDB-backed city tracking with an in-memory fallback when MongoDB is unavailable
 - ↕️ Drag-and-drop reorder of tracked cities (persisted to localStorage)
 - 🔎 City-first add flow: type city name to autocomplete (Open-Meteo geocoding); latitude/longitude are optional

## 🧩 Tech Stack

**Frontend**
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React

**Backend**
- Node.js
- Express
- MongoDB + Mongoose
- Axios
- CORS
- dotenv

## 📁 Project Structure

```text
AeroView/
├─ backend/
│  ├─ config/
│  ├─ models/
│  ├─ routes/
│  └─ server.js
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ hooks/
│  │  └─ styles/
│  └─ vite.config.js
└─ README.md
```

## 🚀 Getting Started

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd AdvancedWeatherApp
```

### 2) Install dependencies

Install the backend and frontend dependencies separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3) Configure environment variables

Create a `.env` file inside `backend/`.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/weather
```

If MongoDB is unavailable, the backend will fall back to its in-memory preview mode so the app can still run locally.

### 4) Start the backend

```bash
cd backend
npm run dev
```

### 5) Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Then open the local Vite URL shown in the terminal.

Note: Vite will attempt to use port 5173 by default; if that port is taken it automatically selects an alternate port (e.g. 5174). Check the terminal output for the correct local URL.

## 🧪 Available Scripts

### Backend

```bash
npm run dev
```
Starts the Express server with Nodemon.

```bash
npm start
```
Starts the backend without file watching.

### Frontend

```bash
npm run dev
```
Starts the Vite development server.

```bash
npm run build
```
Builds the production frontend bundle.

```bash
npm run lint
```
Runs ESLint across the frontend.

## 🔌 API Endpoints

### `GET /api/health`
Returns backend health and database mode.

### `GET /api/cities`
Returns all tracked cities.

### `POST /api/cities`
Adds a city to the tracking board.

Request body:

```json
{
  "name": "Paris",
  "lat": 48.86,
  "lon": 2.35,
  "country": "France"
}
```

### `DELETE /api/cities/:id`
Removes a tracked city.

### `GET /api/weather?lat=...&lon=...&city=...`
Returns detailed weather and air-quality telemetry for a location.

Returned payload now includes optional timezone metadata when available (timezone, timezoneAbbreviation, utcOffsetSeconds, utcOffsetLabel) which the frontend uses to render the city-local clock.

## 🌦️ How It Works

1. The frontend loads the city list from the backend.
2. The active city’s weather is fetched and rendered first.
3. The rest of the city telemetry loads in the background.
4. The backend caches weather responses and falls back to generated mock telemetry if external APIs fail.
5. The UI updates its theme and atmosphere based on the current weather state.

## 🛠️ Troubleshooting

- If the frontend shows no data, make sure the backend is running on port `5000`.
- If MongoDB is offline, the app should still run using in-memory fallback mode.
- If weather data appears delayed on first load, check whether the backend or browser is still downloading the initial bundle.
- If ports are already in use, stop the existing dev servers or change the port in your environment.

- If the canvas backdrop feels heavy or you prefer reduced motion, use the HUD toggle (bottom-center) to disable animations or enable your OS `prefers-reduced-motion` setting — the app respects that preference and will render a single static frame.
- If the app opens to a white page after reload, check the Vite terminal for the actual served port (it may have changed if the default port was busy) and open that URL in the browser.

## 📌 Notes

- The frontend currently expects the backend at `http://localhost:5000/api`.
- The UI is designed for a visually rich desktop-first experience, but it remains responsive on smaller screens.
- Weather data is normalized into simplified condition states like `clear`, `cloudy`, `rainy`, `snowy`, and `stormy`.

## 🧭 Roadmap Ideas

- Add persistent user authentication
- Save favorite city sets per user
- Introduce server-side streaming or incremental dashboard loading
- Add offline cache hydration for faster reloads
- Expose deployment-ready environment configuration for production

---

Built for a high-contrast, atmospheric weather experience.
