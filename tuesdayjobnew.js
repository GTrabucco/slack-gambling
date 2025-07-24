require('dotenv').config();
const { MongoClient } = require('mongodb');
const { getGames } = require('./theoddsapi');      // your converted theoddsapi.js
const { processPicks } = require('./processPicks'); // your converted processPicks.js
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not found in .env file');

async function tuesdayJob(season, week, weekType) {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const session = client.startSession();

    const db = client.db('SlackGambling');
    const picksCollection = db.collection('Picks');
    const picksHistoryCollection = db.collection('Picks_History');
    const gamesCollection = db.collection('Games');
    const gamesHistoryCollection = db.collection('Games_History');

    await session.withTransaction(async () => {
      // Add season and week fields to all picks
      await picksCollection.updateMany({}, { $set: { season, week } }, { session });

      // Backup picks data to a local file (JSON)
      const backupDir = path.join(__dirname, '..', 'backup', season.toString());
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const picksCursor = picksCollection.find({}, { session });
      const picks = await picksCursor.toArray();
      const picksNoId = picks.map(({ _id, ...rest }) => rest);

      // Process picks (add results etc)
      const processedPicks = await processPicks(season, week, picksNoId, weekType);

      // Insert processed picks into Picks_History
      if (processedPicks.length > 0) {
        await picksHistoryCollection.insertMany(processedPicks, { session });
      }

      // Clear Picks collection
      await picksCollection.deleteMany({}, { session });

      // Backup Games to Games_History
      const games = await gamesCollection.find({}, { session }).toArray();
      if (games.length > 0) {
        await gamesHistoryCollection.insertMany(games, { session });
        await gamesCollection.deleteMany({}, { session });
      }

      // Load new games from TheOdds API (39 days from today)
      const now = new Date();
      const from = new Date(now.setHours(0, 0, 0, 0));
      const to = new Date(from.getTime() + 39 * 24 * 60 * 60 * 1000);
      let newGames = await getGames(from, to);

      // Add season and week to new games
      newGames = newGames.map(game => ({ ...game, season, week }));

      if (newGames.length > 0) {
        await gamesCollection.insertMany(newGames, { session });
      }

      console.log(`Tuesday job completed for season ${season}, week ${week}`);
    });

    return `Tuesday job success for season ${season}, week ${week}`;
  } catch (error) {
    console.error('Error during Tuesday job transaction:', error);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = tuesdayJob;
