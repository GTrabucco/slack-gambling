const { MongoClient } = require("mongodb");
const { getGames } = require("./theoddsapinew");
require("dotenv").config();

async function fridayJob(season, week) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const gamesCollection = db.collection("Games");

    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 6);

    const games = await getGames(from, to);
    const gamesWithMeta = games.map(game => ({
      ...game,
      season,
      week,
    }));

    await gamesCollection.insertMany(gamesWithMeta);
  } catch (error) {
    console.error("Error inserting games:", error);
  } finally {
    await client.close();
  }
}

module.exports = fridayJob;
