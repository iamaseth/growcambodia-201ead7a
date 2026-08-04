# Crop Companion

Build a mobile-first Progressive Web App (PWA) designed as an interactive "Crop Growth Lifecycle Tracker, Map Dashboard, and Social Feed." 

### 1. Database Integration (Supabase)

Ensure all data, comments, coordinates, and uploaded images are written directly to a Supabase database backend so that no information is lost on page reloads or refreshes:

- Create tables for `farms` (id, name, lat, lng, address), `plant_logs` (id, farm_id, title, crop_type, status), and `timeline_updates` (id, log_id, growth_stage, notes, image_urls, likes, comments, created_at).

- Automatically configure Row Level Security (RLS) policies so users can read and write data.

### 2. The Home Page Map Dashboard (Landing View)

- At the top of the home page, render an interactive Google Map component using the API key stored in `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

- Fetch all active farms from the database and place a visual marker pin for each location.

- Clicking a map pin opens a clean popup summary window showing the Farm Name, Plant Log Title, current Growth Stage, and a thumbnail of the latest photo. Include a "View Farm Feed" button inside the popup that filters the timeline feed below to display only that specific farm's updates.

### 3. Google Maps Location Integration

- When a user creates a new Farm Profile or a new Plant Log, integrate a Google Map location finder interface.

- Provide a "Detect Current Location" button that grabs the mobile phone's GPS coordinates automatically via browser geolocation.

- Provide a search bar using Google Places Autocomplete to look up specific areas or drop a pin manually on an interactive map overlay. Save Latitude, Longitude, and a text Address string directly to that specific Farm row in Supabase.

### 4. User Setup & Update Workflow

- When creating a new update, the user selects their Farm Name and the specific Plant Log they want to update.

- **Multi-Photo Upload with On-Device Compression:** Users can capture or upload multiple photos for a single update. 

- **Performance Optimization:** Intercept image file data in memory BEFORE uploading. Downscale images to a maximum dimension of 1200px and compress to 75% quality (JPEG/WebP) using a client-side canvas adjustment. Save the compressed files to a Supabase Storage bucket and attach the resulting public URLs to the database row so uploads are instantaneous even on weak field data networks.

### 5. The Main Universal Feed (Facebook-Style)

- Positioned directly below the interactive map dashboard. Displays a rolling, interactive feed of the latest individual updates from all active crop logs.

- Each feed card must show: The Farm Name, a clickable location pin icon, the Plant Log Title, current Growth Stage, text Notes, a swipeable carousel gallery of the compressed photos, a Like counter, and an interactive Comment section.

- **Filtering:** Include a sticky filter bar at the top of the feed allowing users to filter posts by Timeframes ("Day", "Week", "Month") or by specific "Farms".

### 6. Interactive "Deep-Dive" Navigation & History

- On every post card within the main feed, make the Plant Log Title highly clickable and add a "View Full History" button at the bottom of the card.

- Clicking the title or button must open a dedicated screen showing the entire historical lifestyle tree of that specific plant log in reverse chronological order (newest updates at the top, oldest at the bottom). 

- At the top of this isolated history view, include an "Update Timeline" button so a farmer can quickly add a new growth stage update directly to this specific plant log.

- Include a clear "Back to Feed" button at the top of the history view to return to the universal wall without losing scroll position.

### 7. UI/UX & PWA Speed Architecture

- Configure the application structure as an installable PWA layout. 

- Ensure smooth, high-contrast, minimalist mobile design using Tailwind CSS, optimized for outdoor, rapid scrolling and tapping.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://growcambodia.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/441035ed-b074-4d59-a725-477c7c8230f9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
