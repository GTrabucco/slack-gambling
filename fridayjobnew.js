const { MongoClient } = require("mongodb");
const { getGames } = require("./theoddsapinew");
require("dotenv").config();

async function fridayJob(season, week, weekType) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const gamesCollection = db.collection("Games");

    const now = new Date();
    const currentDay = now.getDay();
    const friday = new Date(now);
    friday.setDate(now.getDate() - currentDay + 5);
    friday.setHours(0, 0, 0, 0);
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3); 
    monday.setHours(23, 59, 59, 999);

    const games = await getGames(friday, monday);
    const newGames = games.map(game => ({
      ...game,
      season,
      week,
    }));

    console.log(newGames)

    await gamesCollection.insertMany(newGames);
  } catch (error) {
    console.error("Error inserting games:", error);
  } finally {
    console.log('Friday Job Finished')
    await client.close();
  }
}

module.exports = fridayJob;
