import express from "express";
import pool from "../db.js";

const router = express.Router();

// Join a group
router.post("/join", async (req, res) => {
  try {
    const { username, groupName } = req.body;

    // Get user ID
    const userRes = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userRes.rows[0].id;

    // Get group ID (or create group if not exists)
    let groupRes = await pool.query(
      "SELECT id FROM groups WHERE name = $1",
      [groupName]
    );

    let groupId;
    if (groupRes.rows.length === 0) {
      const newGroupRes = await pool.query(
        "INSERT INTO groups (name) VALUES ($1) RETURNING id",
        [groupName]
      );
      groupId = newGroupRes.rows[0].id;
    } else {
      groupId = groupRes.rows[0].id;
    }

    // Check if user is already a member of the group
    const membershipCheck = await pool.query(
      "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (membershipCheck.rows.length > 0) {
      return res.status(409).json({ error: `You are already a member of ${groupName}` });
    }

    // Insert into group_members (avoid duplicates)
    await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [groupId, userId]
    );

    res.json({ success: true, message: `Joined group ${groupName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to join group" });
  }
});

// get all friends a user has
router.get("/:groupName", async (req, res) => {
    try{
        const { groupName } = req.params;

        // Get group ID
        const groupRes = await pool.query(
          "SELECT id FROM groups WHERE name = $1",
          [groupName]
        );
        if (groupRes.rows.length === 0) {
          return res.status(404).json({ error: "Group not found" });
        }
        const groupId = groupRes.rows[0].id;

        // Get users in that group
        const membersRes = await pool.query(
          `SELECT u.id, u.username
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1`,
          [groupId]
        );

        res.json(membersRes.rows);
      } catch (err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch group data" });
      }
});

export default router;
