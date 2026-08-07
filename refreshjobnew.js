import { MongoClient } from "mongodb";
import { getGames } from "./espnapi.js";
import dotenv from "dotenv";
import { logCronRun } from "./cronLogger.js";
dotenv.config();

export default async function refreshJob() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const gamesCollection = db.collection("Games");
    const configCollection = db.collection("Config");

    const config = await configCollection.findOne({ _id: 'current' });
    if (!config) {
      console.log("Refresh job: no config found, skipping.");
      return "No config found.";
    }
    const { season, week, weekType } = config;

    const freshGames = await getGames(season, weekType, week);
    if (freshGames.length === 0) {
      console.log("Refresh job: no games returned from ESPN.");
      return "No games returned from ESPN.";
    }

    const now = new Date();
    let updatedCount = 0;

    for (const freshGame of freshGames) {
      const result = await gamesCollection.updateOne(
        { gameId: freshGame.gameId, commence_time: { $gt: now.toISOString() } },
        {
          $set: {
            home_spread: freshGame.home_spread,
            away_spread: freshGame.away_spread,
            over: freshGame.over,
            under: freshGame.under,
            commence_time: freshGame.commence_time,
          },
        }
      );
      if (result.matchedCount > 0) updatedCount++;
    }

    console.log(`Refresh job: updated lines for ${updatedCount} games.`);
    const successMsg = `Refresh job success: updated ${updatedCount} games.`;
    await logCronRun('Refresh Job', 'success', successMsg);
    return successMsg;
  } catch (error) {
    console.error("Error during refresh job:", error);
    await logCronRun('Refresh Job', 'error', error.message);
    throw error;
  } finally {
    await client.close();
  }
}
