import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";
import { getGames } from "./theoddsapinew.js";     
import { processPicks } from "./processpicksnew.js";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not found in .env file');

export default async function tuesdayJob(season, week, weekType) {
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
      // backup picks
      const picksToSave = await picksCollection.find({}).toArray();
      if (picksToSave.length > 0) {
        try {
          const now = new Date();
          const fileName = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
            now.getDate()
          ).padStart(2, "0")}${now.getFullYear()}.txt`;
          const filePath = path.join("backups", fileName);

          fs.writeFileSync(filePath, JSON.stringify(picksToSave, null, 2), "utf-8");
          console.log(`Backup saved to ${filePath}`);
        } catch (fileErr) {
          console.error("Failed to create backup file:", fileErr);
          throw fileErr; 
        }
      }
      
      // Add week fields to all picks
      await picksCollection.updateMany({}, { $set: { week } }, { session });

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
        
      // Backup Games to Games_History
      const games = await gamesCollection.find({}, { session }).toArray();
      if (games.length > 0) {
        await gamesHistoryCollection.insertMany(games, { session });
        await gamesCollection.deleteMany({}, { session });
      }
      
      // Load new games from TheOdds API
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

export async function removeDuplicates(db){
  const picksCollection = db.collection('Picks_History');
  const duplicates = await picksCollection
    .aggregate([
      {
        $group: {
          _id: { week: "$week", username: "$username", text: "$text" },
          ids: { $addToSet: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } } // only groups with duplicates
    ])
    .toArray();

  console.log(`Found ${duplicates.length} groups of duplicates.`);

  for (const doc of duplicates) {
    // Keep the first id, delete the rest
    const [keepId, ...deleteIds] = doc.ids;
    if (deleteIds.length > 0) {
      await picksCollection.deleteMany({ _id: { $in: deleteIds } });
      console.log(
        `Removed ${deleteIds.length} duplicate(s) for week=${doc._id.week}, username=${doc._id.username}, text=${doc._id.text}`
      );
    }
  }
}
