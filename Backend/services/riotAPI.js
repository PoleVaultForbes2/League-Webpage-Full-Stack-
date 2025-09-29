export async function getSummonerDataByName(summonerName, api_key, tag_line) {
    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${tag_line}?api_key=${api_key}`;

    try {
        const res = await fetch(url);
        
        console.log(`📊 Response status: ${res.status} ${res.statusText}`);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ API Error Response: ${errorText}`);
            
            if (res.status === 401) {
                throw new Error("Invalid API key - check your RIOT_API_KEY");
            } else if (res.status === 404) {
                throw new Error(`Summoner not found: ${summonerName}#${tag_line}`);
            } else if (res.status === 429) {
                throw new Error("Rate limit exceeded - too many requests");
            } else if (res.status === 403) {
                throw new Error("Forbidden - API key may not have required permissions");
            } else {
                throw new Error(`API request failed with status ${res.status}: ${errorText}`);
            }
        }
        
        const data = await res.json();
        console.log(`✅ Successfully fetched data for ${summonerName}#${tag_line}`);
        console.log(`📋 PUUID: ${data.puuid?.substring(0, 8)}...`);
        return data;
        
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error(`🌐 Network error: ${error.message}`);
            throw new Error("Network error - check your internet connection");
        }
        console.error(`💥 Error in getSummonerDataByName: ${error.message}`);
        throw error;
    }
}

export async function getRecentMatches(puuid, count = 5, api_key) {
  const res = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&api_key=${api_key}`,
  );
  return res.json();
}

export async function getMatchDetails(matchId, api_key){
  const res = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/?api_key=${api_key}`
  );
  return res.json();
}