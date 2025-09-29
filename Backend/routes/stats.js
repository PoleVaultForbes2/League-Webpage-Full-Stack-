// routes/stats.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/leaderboard", async (req, res) => {
  try {
    // get the group name
    const { groupName } = req.query;
    let users;

    if (groupName === "*all" || !groupName) {
      // If groupName is '*all' or not provided, get all users
      const usersResult = await pool.query("SELECT id, username FROM users");
      users = usersResult.rows;
    } else {
      // get group id from group name
      const groupResult = await pool.query(
        "SELECT id FROM groups WHERE name = $1",
        [groupName]
      );

      if(groupResult.rows.length === 0){
        return res.status(404).json({ error: "Group not found" });
      }

      const groupId = groupResult.rows[0].id;

      // now fetch users in that group
      const groupUserResult = await pool.query(
        `SELECT u.id, u.username
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = $1`,
        [groupId]
      );
      users = groupUserResult.rows;
    }

    const results = await Promise.all(
      users.map(async (user) => {
        // last 5 matches for this user
        const matchesRes = await pool.query(
          `SELECT kills, deaths, assists, win
           FROM matches
           WHERE user_id = $1
           ORDER BY timestamp DESC
           LIMIT 5`,
          [user.id]
        );

        const matches = matchesRes.rows;
        if (matches.length === 0) return null;

        // total number of stats from the 5 matches
        const kills = matches.reduce((a, m) => a + m.kills, 0);
        const deaths = matches.reduce((a, m) => a + m.deaths, 0);
        const assists = matches.reduce((a, m) => a + m.assists, 0);
        const wins = matches.filter((m) => m.win).length;

        return {
          username: user.username,
          kda: ((kills + assists) / Math.max(1, deaths)).toFixed(2),
          winRate: ((wins / matches.length) * 100).toFixed(0),
        };
      })
    );

    const filtered = results.filter(Boolean);

    // find the top 3 for each cat.
    let topKDA = [...filtered].sort((a, b) => b.kda - a.kda);
    let topWinRate = [...filtered].sort((a, b) => b.winRate - a.winRate);

    // If for the homepage then do top 3
    if(groupName === "*all"){
      topKDA = topKDA.slice(0, 3)
      topWinRate= topWinRate.slice(0, 3)
    }
    

    res.json({ topKDA, topWinRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

export default router;
