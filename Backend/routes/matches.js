import express from "express";
import { getRecentMatches, getMatchDetails, getSummonerDataByName } from "../services/riotAPI.js";
import pool from "../db.js";
import dotenv from "dotenv";


dotenv.config();
const RIOT_KEY = process.env.RIOT_API_KEY;

const router = express.Router();

/*
GOAL OF THE SERVER:
    1. Check if user needs daily update (last_updated is not today)
    2. Look up user by userID (username)
    3. Call Riot to get puuid
    4. Get recent matchIDs by puuid
    5. Fetch match details and insert new matches only
    6. Maintain max 20 matches per user
    7. Update last_updated timestamp
*/

// Check if user needs daily update
async function needsDailyUpdate(username){
  const result = await pool.query(
    "SELECT last_updated FROM users WHERE username = $1",
    [username]
  );

  if(result.rows.length === 0){
    return false; // doesn't exist
  }

  const lastUpdated = result.rows[0].last_updated;
  const today = new Date().toDateString();

  return !lastUpdated || new Date(lastUpdated).toDateString() !== today;
}


// Save matches for a given user
router.post("/sync/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Check if daily update is needed 
    const needsUpdated = await needsDailyUpdate(username);
    if(!needsUpdated){
      return res.json({
        success: true,
        message: "Already updated today, skipping sync"
      });
    }

    // Look up userId from DB
    const userResult = await pool.query(
      "SELECT id, tag_line FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    const tag_line = userResult.rows[0].tag_line || "NA1";

    // Get the puuid
    const summoner = await getSummonerDataByName(username, RIOT_KEY, tag_line)
    const puuid = summoner.puuid

    // Fetch match data
    const matchIds = await getRecentMatches(puuid, 5, RIOT_KEY);

    const existingMatches = await pool.query(
      "SELECT match_id FROM matches WHERE user_id = $1",
      [userId]
    );
    const existingMatchesIds = new Set(existingMatches.rows.map(row => row.match_id));

    let newMatchesAdded = 0;

    // Process each match
    for (const matchId of matchIds) {
      // Skip if we already have this match
      if(existingMatchesIds.has(matchId)){
        continue;
      }

      try{
        const match = await getMatchDetails(matchId, RIOT_KEY);

        const participant = match.info.participants.find(
          (p) => p.puuid === puuid
        );

        if (!participant) {
          continue;
        }

        await pool.query(
          `INSERT INTO matches 
          (match_id, user_id, champion, kills, deaths, assists, win, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (match_id, user_id) DO NOTHING`,
          [
            matchId,
            userId,
            participant.championName,
            participant.kills,
            participant.deaths,
            participant.assists,
            participant.win,
            new Date(match.info.gameEndTimestamp)
          ]
        );
        newMatchesAdded++;
      } catch(matchError){
        console.log(`Error processing match ${matchId}:`, matchError);
      }
    }

    // Maintain maximum of 20 matches per user
    await pool.query(
      `DELETE FROM matches 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM matches 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 20
       )`,
      [userId]
    );

    await pool.query(
      "UPDATE users SET last_updated = CURRENT_DATE WHERE username = $1",
      [username]
    );

    res.json({ 
      success: true,
      newMatchesAdded,
      message: `Successfully synced ${newMatchesAdded} new matches`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync matches" });
  }
});

router.get("/:username/recent", async (req, res) => {
    const { username } = req.params;

    const userResult = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  const userId = userResult.rows[0].id;

    const result = await pool.query(
        'SELECT * FROM matches WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20',
        [userId]
    );

    res.json(result.rows);
});

// Manual sync endpoint (bypasses daily check - useful for testing)
router.post("/force-sync/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Look up userId from DB
    const userResult = await pool.query(
      "SELECT id, tag_line FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;
    const tag_line = userResult.rows[0].tag_line || "NA1";

    // Get the puuid
    const summoner = await getSummonerDataByName(username, RIOT_KEY, tag_line);
    const puuid = summoner.puuid;

    // Fetch recent match IDs
    const matchIds = await getRecentMatches(puuid, 5, RIOT_KEY);

    let newMatchesAdded = 0;

    // Process each match
    for (const matchId of matchIds) {
      try {
        const match = await getMatchDetails(matchId, RIOT_KEY);
        
        const participant = match.info.participants.find(
          (p) => p.puuid === puuid
        );

        if (!participant) {
          continue;
        }

        // Insert new match (ON CONFLICT DO NOTHING prevents duplicates)
        const result = await pool.query(
          `INSERT INTO matches 
           (match_id, user_id, champion, kills, deaths, assists, win, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (match_id, user_id) DO NOTHING
           RETURNING id`,
          [
            matchId,
            userId,
            participant.championName,
            participant.kills,
            participant.deaths,
            participant.assists,
            participant.win,
            new Date(match.info.gameEndTimestamp)
          ]
        );

        if (result.rows.length > 0) {
          newMatchesAdded++;
        }
      } catch (matchError) {
        console.error(`Error processing match ${matchId}:`, matchError);
      }
    }

    // Maintain maximum of 20 matches per user
    await pool.query(
      `DELETE FROM matches 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM matches 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 20
       )`,
      [userId]
    );

    // Update the last_updated timestamp
    await pool.query(
      "UPDATE users SET last_updated = CURRENT_DATE WHERE username = $1",
      [username]
    );

    res.json({ 
      success: true, 
      newMatchesAdded,
      message: `Force sync completed: ${newMatchesAdded} new matches added`
    });

  } catch (err) {
    console.error("Force sync error:", err);
    res.status(500).json({ error: "Failed to force sync matches" });
  }
});

export default router;
