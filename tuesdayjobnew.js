import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";
import { getGames } from "./theoddsapinew.js";     
import { processPicks } from "./processpicksnew.js";
import twilio from "twilio";

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
      // Add week fields to all picks
      await picksCollection.updateMany({}, { $set: { week } }, { session });

      const picksCursor = picksCollection.find({}, { session });
      let picks = await picksCursor.toArray();
      const gamesForWeek = await gamesCollection.find({}, { session }).toArray();
      const gameTimeById = gamesForWeek.reduce((acc, game) => {
        acc[String(game._id)] = game.commence_time;
        if (game.gameId) {
          acc[String(game.gameId)] = game.commence_time;
        }
        return acc;
      }, {});

      const picksNoId = picks.map(({ _id, ...rest }) => ({
        ...rest,
        commence_time: rest.gameId ? gameTimeById[String(rest.gameId)] ?? null : null
      }));

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
            createdAt: Date(),
            commence_time: null
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
      
      // Load new games from TheOdds API — full week (Tue through Mon)
      const now = new Date();
      const currentDay = now.getDay();
      const tuesday = new Date(now);
      tuesday.setDate(now.getDate() - currentDay + 2);
      tuesday.setHours(0, 0, 0, 0);
      const monday = new Date(tuesday);
      monday.setDate(tuesday.getDate() + 6);
      monday.setHours(23, 59, 59, 999);
      let newGames = await getGames(tuesday, monday);

      // Add season and week to new games
      week = parseInt(week) + 1
      newGames = newGames.map(game => ({ ...game, season, week }));
      if (newGames.length > 0) {
        await gamesCollection.insertMany(newGames, { session });
      }

      console.log(`Tuesday job completed for season ${season}, week ${week}`);
    });

    await sendPicksBackup(picks, week - 1);

    return `Tuesday job success for season ${season}, week ${week}`;
  } catch (error) {
    console.error('Error during Tuesday job transaction:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function sendPicksBackup(picks, week) {
  try {
    const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const byUser = picks.reduce((acc, pick) => {
      if (!acc[pick.username]) acc[pick.username] = {};
      acc[pick.username][pick.type] = pick;
      return acc;
    }, {});

    const userEntries = Object.entries(byUser);
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < userEntries.length; i += chunkSize) {
      chunks.push(userEntries.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      const lines = [`Wk${week} Picks (${i + 1}/${chunks.length}):`];
      for (const [username, userPicks] of chunks[i]) {
        const name = username.split("@")[0];
        const parts = ['favorite', 'dog', 'over', 'under', 'gotw'].map(type => {
          const pick = userPicks[type];
          if (!pick) return `${type}-none`;
          if (type === 'over' || type === 'under') {
            const away = pick.awayTeam.split(" ").pop();
            const home = pick.homeTeam.split(" ").pop();
            return `${type}-${pick.value}(${away}@${home})`;
          }
          return `${type}-${pick.text}`;
        });
        lines.push(`${name}: ${parts.join(', ')}`);
      }

      await twilioClient.messages.create({
        body: lines.join('\n'),
        from: "+18334966404",
        to: process.env.ADMIN_PHONE_NUMBER,
      });
    }

    console.log(`Picks backup sent in ${chunks.length} messages.`);
  } catch (err) {
    console.error("Failed to send picks backup text:", err);
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
