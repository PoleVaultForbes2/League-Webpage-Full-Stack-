const API_BASE = import.meta.env.VITE_API_URL;


// Get recent matches for a user from the database
export async function getRecentMatches(username) {
  const res = await fetch(`${API_BASE}/api/matches/${username}/recent`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

// Sync matches with daily update logic (only updates once per day)
export async function syncMatches(username) {
  const res = await fetch(`${API_BASE}/api/matches/sync/${username}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Force sync matches (bypasses daily check - useful for testing)
export async function forceSyncMatches(username) {
  try {
    const response = await fetch(`${API_BASE}/api/matches/force-sync/${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Force sync result:', result.message);
    return result;
  } catch (error) {
    console.error('Error force syncing matches:', error);
    throw error;
  }
}
