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
    const { season, weekType } = config;
    // Config.week is kept in sync with the currently loaded Games by tuesdayjobnew.js
    // (which saves config.week to match whatever week it just loaded games for).
    const week = parseInt(config.week);

    const freshGames = await getGames(season, weekType, week);
    if (freshGames.length === 0) {
      console.log("Refresh job: no games returned from ESPN.");
      return "No games returned from ESPN.";
    }

    const now = new Date();
    let updatedCount = 0;
    const changes = [];
    const movementDocs = [];

    for (const freshGame of freshGames) {
      const existing = await gamesCollection.findOne({
        gameId: freshGame.gameId,
        commence_time: { $gt: now.toISOString() },
      });
      if (!existing) continue;

      const diffs = [];
      if (existing.home_spread !== freshGame.home_spread || existing.away_spread !== freshGame.away_spread) {
        diffs.push(`spread ${existing.away_spread}/${existing.home_spread}→${freshGame.away_spread}/${freshGame.home_spread}`);
        movementDocs.push({
          gameId: freshGame.gameId,
          homeTeam: freshGame.home_team,
          awayTeam: freshGame.away_team,
          commenceTime: freshGame.commence_time,
          type: 'spread',
          from: { home: existing.home_spread, away: existing.away_spread },
          to: { home: freshGame.home_spread, away: freshGame.away_spread },
          timestamp: now,
        });
      }
      if (existing.over !== freshGame.over) {
        diffs.push(`O/U ${existing.over}→${freshGame.over}`);
        movementDocs.push({
          gameId: freshGame.gameId,
          homeTeam: freshGame.home_team,
          awayTeam: freshGame.away_team,
          commenceTime: freshGame.commence_time,
          type: 'total',
          from: existing.over,
          to: freshGame.over,
          timestamp: now,
        });
      }
      if (!diffs.length) continue;

      await gamesCollection.updateOne(
        { gameId: freshGame.gameId },
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
      updatedCount++;
      changes.push(`${freshGame.away_team}@${freshGame.home_team}: ${diffs.join(', ')}`);
    }

    const changeDetail = changes.length ? `\n${changes.join('\n')}` : '';
    if (movementDocs.length > 0) {
      await db.collection('Line_Movements').insertMany(movementDocs);
    }
    console.log(`Refresh job: updated odds for ${updatedCount} games.${changeDetail}`);
    const successMsg = `Refresh job success: updated odds for ${updatedCount} games.${changeDetail}`;
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
