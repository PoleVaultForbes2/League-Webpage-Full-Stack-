# League Group Leaderboard

## Author
**Josh Forbes**

## Overview
This project is a **full-stack web application** that creates competitive leaderboards for League of Legends player groups.  
Users can log in, join groups, and view a dynamic leaderboard of stats for themselves and their teammates.  
The system integrates the **Riot API** with a **PostgreSQL database**, caching match data for each player, limiting stored games to the most recent 20, and automatically updating stats daily.  

The goal is to provide **real-time, group-based performance tracking** while strengthening skills in backend API design, frontend Vue development, and database schema design.

---

## File Description

- **Backend**
  - **`server.js`**: Express app entry point, configures routes and middleware.  
  - **`db.js`**: PostgreSQL connection pool.  
  - **`routes/groups.js`**: Group-related logic (join group, get leaderboard).  
  - **`routes/users.js`**: User authentication and Riot API integration.  
  - **`routes/stats.js`**: Leaderboard fetch, match storage, and update jobs.  
  - **`cron/updateMatches.js`**: Daily script to refresh match data for all users.

- **Frontend**
  - **`App.vue`**: Main container, manages state, passes data to components.  
  - **`components/Navbar.vue`**: Navigation bar with login/logout and group controls.  
  - **`components/GroupLeaderboard.vue`**: Displays leaderboard for the selected group.  
  - **`components/SingleCard.vue`**: Displays an individual player’s match stats.

- **Database**
  - **`schema.sql`**: Contains definitions for `users`, `groups`, `user_groups`, `matches`.  

---

## Database Schema

### `users`
- `id SERIAL PRIMARY KEY`  
- `username TEXT UNIQUE NOT NULL`  
- `last_updated DATE`  

### `groups`
- `id SERIAL PRIMARY KEY`  
- `name TEXT UNIQUE NOT NULL`  

### `user_groups`
- `id SERIAL PRIMARY KEY`  
- `user_id INT REFERENCES users(id)`  
- `group_id INT REFERENCES groups(id)`  

### `matches`
- `id SERIAL PRIMARY KEY`  
- `user_id INT REFERENCES users(id)`  
- `game_id TEXT UNIQUE NOT NULL`  
- `kills INT, deaths INT, assists INT, gold INT, damage INT`  
- `played_at TIMESTAMP`  

Rules:
- Each user may have a **max of 20 matches**.  
- Oldest matches are removed when new ones are inserted.

---

## API Routes

### Groups
- `POST /api/groups/join`  
  Join a group given `username` and `groupName`.  
  Creates the group if it doesn’t exist.  

- `GET /api/groups/:groupName/leaderboard`  
  Fetches the leaderboard for the given group, aggregating recent match stats.  

### Users
- `POST /api/users/login`  
  Logs in a player, creates account if first-time login.  

- `GET /api/users/:username/matches`  
  Fetches cached matches from the DB or updates via Riot API.  

### Stats
- `GET /api/leaderboard`  
  Returns a leaderboard for **all users** (for debugging or admin use).  

---

## Frontend Flow

1. **Login**: User enters summoner name → checked in DB or Riot API.  
2. **Join Group**: Enter a group name → adds user to that group.  
3. **View Leaderboard**: Displays player stats for all users in the selected group.  
4. **Daily Updates**: Server cron job refreshes each user’s most recent matches.  

---

## Example Code Snippet

```js
// Example: Fetch leaderboard for a group
async function fetchLeaderboard(groupName) {
  const res = await fetch(`${API_BASE}/api/groups/${groupName}/leaderboard`);
  if(res.ok){
    return await res.json();
  }
  throw new Error("Failed to fetch leaderboard");
}
