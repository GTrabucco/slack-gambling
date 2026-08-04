import { MongoClient } from "mongodb";
import { getGames } from "./theoddsapinew.js";
import dotenv from "dotenv";
import { logCronRun } from "./cronLogger.js";
dotenv.config();

export default async function refreshJob() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const gamesCollection = db.collection("Games");

    const now = new Date();

    // Only refresh games that haven't started yet
    const upcomingGames = await gamesCollection
      .find({ commence_time: { $gt: now.toISOString() } })
      .toArray();

    if (upcomingGames.length === 0) {
      console.log("Refresh job: no upcoming games to refresh.");
      return "No upcoming games to refresh.";
    }

    const times = upcomingGames.map(g => new Date(g.commence_time));
    const minTime = new Date(Math.min(...times));
    const maxTime = new Date(Math.max(...times));
    maxTime.setHours(23, 59, 59, 999);

    const freshGames = await getGames(minTime, maxTime);

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
