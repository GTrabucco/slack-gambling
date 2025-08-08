require('dotenv').config();
const { MongoClient } = require('mongodb');
const { getGames } = require('./theoddsapinew');     
const { processPicks } = require('./processpicksnew');

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
    const userDetails = db.collection('User_Details');

    await session.withTransaction(async () => {
      console.log('in')
      // Add season and week fields to all picks
      /*await picksCollection.updateMany({}, { $set: { season, week } }, { session });

      const picksCursor = picksCollection.find({}, { session });
      let picks = await picksCursor.toArray();
      const picksNoId = picks.map(({ _id, ...rest }) => rest);

      // Step 1: Build user-to-picks map
      const picksByUser = picksNoId.reduce((acc, pick) => {
        if (!acc[pick.username]) acc[pick.username] = [];
        acc[pick.username].push(pick);
        return acc;
      }, {});

      // Step 2: Fetch all users
      const users = await userDetails.find({}, { session }).toArray();
      const usernames = users.map(u => u.username);

      // Step 3: Fill missing picks
      for (const username of usernames) {
        const userPicks = picksByUser[username] || [];
        const typesPicked = userPicks.map(p => p.type);
        const allTypes = ['favorite', 'dog', 'over', 'under'];

        const missingTypes = allTypes.filter(t => !typesPicked.includes(t));

        for (const type of missingTypes) {
          const blankPick = {
            username,
            type,
            gameId: null,
            text: `Did not submit a ${type}`,
            season,
            week,
            result: -1,
            createdAt: Date()
          };
          picksNoId.push(blankPick);
        }
      }

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
      */
      // Load new games from TheOdds API (39 days from today)
      const now = new Date();
      const currentDay = now.getDay();
      const tuesday = new Date(now);
      tuesday.setDate(now.getDate() - currentDay + 2); 
      tuesday.setHours(0, 0, 0, 0);
      const thursday = new Date(tuesday.getTime() + 2 * 24 * 60 * 60 * 1000);
      thursday.setHours(23, 59, 59, 999); 
      let newGames = await getGames(tuesday, thursday);

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
