# CS2 Surf Web Panel

### ATTENTION THIS IS CODED TO SUPPORT SHARPTIMER DEV BRANCH!, IT WILL NOT WORK PROPERLY WITH 0.3.1x.
A comprehensive, self-hostable web panel for Counter-Strike 2 surf servers running the [SharpTimer](https://github.com/Letaryat/poor-sharptimer) plugin. 

The application is fully containerized with Docker, making deployment straightforward.

# NOTES
this project started as a personal project for my server [rage.surf](https://rage.surf), which I hardcoded to it and just adapted to release public, some features may be bad coded, not work as expected, etc. Feel free to contribute to it with PR.

LIVE PREVIEW: https://rage.surf

_I plan to add updates to it, if you want to discuss ideas, hop on this DC server: https://discord.gg/SS2fRuxupm and we can discuss the future of this poor panel xD_
<img width="1281" height="1347" alt="image" src="https://github.com/user-attachments/assets/f70dbf43-fbc2-4b30-a1c8-66c3cfa3f7e0" />


## Features

- **Live Server Browser:** View a list of your game servers with real-time player counts, current map, and server status.
- **Global Leaderboards:** Track top players by global points and see the most recent records set across all servers.
- **Map-Specific Leaderboards:** Browse leaderboards for individual maps, including main tracks and bonuses.
- **External Global Rankings:** Integration with [ST-Global](https://st-global.net/) to fetch and display global map records.
- **Detailed Player Profiles:** View individual player profiles with rank, points, total runs, recent map performances, and top records.
- **Map Browser:** A dedicated page to browse all available surf maps, with details on tiers, bonuses, and styles.
- **Player Search:** Easily find any player's profile and stats by searching their name or SteamID.
- **Multi-Language Support:** Interface available in English and Portuguese (BR). 
- >_IF YOU WANT TO ADD YOUR LANGUAGE TO THIS PROJECT, FORK, CREATE THE JSON AND MAKE A PR_
- **Steam Avatar Caching:** An efficient system to cache player avatars, reducing calls to the Steam API.
- **Dockerized Deployment:** Simplified setup and deployment using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your server.
- A running MySQL/MariaDB server.
- A CS2 game server with the [SharpTimer](https://github.com/DEAFPS/SharpTimer) plugin installed and configured to use a MySQL database.
- A [Steam Web API Key](https://steamcommunity.com/dev/apikey).

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/bnt0p/st-poor-webpanel.git
cd st-poor-webpanel
```

### 2. Configure Environment Variables
Create a `.env` file by copying the example file:
```bash
cp .env.example .env
```
Now, edit the `.env` file with your specific configuration:
```
| Variable            | Description                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STEAM_API_KEY`     | Your Steam Web API key.                                                                                                                                                 |
| `DB_HOST_STEAM`     | Hostname/IP of the MySQL server for the **avatar cache**atabase.                                                                                                        |
| `DB_PORT_STEAM`     | Port for the avatar cache MySQL server (e.g., `3306`)                                                                                                                   |
| `DB_USER_STEAM`     | Username for the avatar cache database.                                                                                                                                 |
| `DB_PASSWORD_STEAM` | Password for the avatar cache database.                                                                                                                                 |
| `DB_NAME_STEAM`     | Name of the avatar cache database.                                                                                                                                      |
| `DB_HOST_SURF`      | Hostname/IP of the MySQL server for your **SharpTimer** database.                                                                                                       |
| `DB_PORT_SURF`      | Port for the SharpTimer MySQL server.                                                                                                                                   |
| `DB_USER_SURF`      | Username for the SharpTimer database.                                                                                                                                   |
| `DB_PASSWORD_SURF`  | Password for the SharpTimer database.                                                                                                                                   |
| `DB_NAME_SURF`      | Name of the SharpTimer database.                                                                                                                                        |
| `TOKEN`             | Your token for the ST-Global API for fetching external records. Apply at `https://st-global.net/apply`.                                                                 |
| `SERVER_LIST`       | A JSON array of your server IP:PORT strings. Example: `SERVER_LIST='["127.0.0.1:27015", "127.0.0.1:27016"]'`.                                                           |
| `TZ`                | The timezone for the containers, e.g., `America/Sao_Paulo`.                                                                                                             |
| `VITE_API_URL`      | The public-facing URL for your backend API, e.g., `https://api.yourdomain.com`. You must set up a reverse proxy for this.                                               |
| `DOMAIN_NAME`       | Your main domain name to be allowed by Vite for Cross-Origin Resource Sharing (CORS), e.g., `yourdomain.com`.                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
```
### 3. Set up the Avatar Cache Database
You need a separate database to cache Steam avatars. This reduces rate-limiting issues with the Steam API.
1. Create a new database in your MySQL server (the name should match `DB_NAME_STEAM` in your `.env` file).
2. Import the provided SQL schema into this new database:
   ```bash
   mysql -u YOUR_MYSQL_USER -p YOUR_CACHE_DB_NAME < ./mysql/steam_cache.sql
   ```

### 4. Configure Your Map List
The web panel loads map information from the `backend/maps.txt` file. Edit this file to add or remove maps. The format for each line is:
`map_name:workshop_id:tier:bonuses:style`

Example:
```
surf_utopia_njv:3073875025:1:0:linear
surf_whiteout:3296258256:1:1:staged
```
You can generate the maps.txt file with this command:
```bash
curl -s -X POST https://stglobal-webpanel.vercel.app/api/maps -H "Content-Type: application/json" --data-raw '{"tier": 0, "limit": 999999}' | jq -r '.data[] | "\(.name):\(.workshop_id):\(.difficulty):\(.bonuses):\(.type)"' > backend/maps.txt
```

If you want to have a maplist.txt for your RockTheVote plugin up to date with the maps that are added to global database, use this to generate it and place on your RockTheVote:
```bash
curl -s -X POST https://stglobal-webpanel.vercel.app/api/maps -H "Content-Type: application/json" --data-raw '{"tier": 0, "limit": 999999}' | jq -r '.data[] | "\(.name):\(.workshop_id)"' > maplist.txt
```

The above command will provide a maplist.txt with map_name:workshop_id so you can place to your RTV plugin.

### 5. Configure Your Reverse Proxy
The frontend needs to communicate with the backend API. You must set up a reverse proxy (like Nginx or Caddy) to forward requests from your public API URL (`VITE_API_URL`) to the backend container. The backend runs on `http://127.0.0.1:3001` inside the host.

On the nginx/ folder for this repository, there's a reverse proxy example.


### 6. Launch the Application
Build and run the Docker containers:
```bash
docker compose up --build -d
```
The frontend will be accessible at `http://127.0.0.1:4175`. You should configure your web server to reverse proxy to this address.

## I see the project updated. How do I update it too?

Just run `git pull` where you cloned it, and rerun the docker structure. No need to reload/restart nginx or your reverse proxy handler.
```
docker compose up -d --build --force-recreate
```

## Project Structure

```
.
├── backend/          # FastAPI backend application
│   ├── main.py       # Main API logic and endpoints
│   ├── maps.txt      # Custom list of surf maps
│   └── ...
├── frontend/         # React/Vite frontend application
│   ├── src/
│   │   ├── pages/    # React components for each page
│   │   ├── components/ # Reusable UI components
│   │   ├── lang/     # Language files for i18n
│   └── ...
├── mysql/            # Database schemas
│   └── steam_cache.sql # SQL schema for the avatar cache
├── nginx/            # Database schemas
│   └── backend_and_frontend.conf # Nginx example for reverse proxy using same domain and /api instead of subdomain.
│   └── frontend.conf # Nginx example for reverse proxy using domain for frontend
│   └── backend.conf # Nginx example for reverse proxy using a subdomain for backend/api
│   ├── certs/
│       └── nginx.crt   # Self signed SSL certificate for the domain/subdomain so you can use cloudflare proxy
│       └── nginx.key   # Self signed SSL certificate for the domain/subdomain so you can use cloudflare proxy
├── Dockerfile.backend  # Dockerfile for the backend
├── Dockerfile.frontend # Dockerfile for the frontend
├── compose.yml         # Docker Compose file for orchestration
└── .env.example      # Example environment configuration
```

This project is under GNU General Public License v3.0. Refer to LICENSE.md.