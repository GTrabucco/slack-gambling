import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";
import axios from "axios";
import { getGames } from "./espnapi.js";
import { processPicks } from "./processpicksnew.js";
import twilio from "twilio";
import { logCronRun } from "./cronLogger.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI not found in .env file');

export default async function tuesdayJob(seasonParam, weekParam, weekTypeParam) {
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
    const configCollection = db.collection('Config');

    // Use passed params, or fall back to Config in DB
    let season, week, weekType;
    if (seasonParam && weekParam && weekTypeParam) {
      season = seasonParam;
      week = weekParam;
      weekType = weekTypeParam;
    } else {
      const config = await configCollection.findOne({ _id: 'current' });
      if (!config) throw new Error('Config not found in DB. Please set season, week, and weekType via the admin panel.');
      ({ season, week, weekType } = config);
    }

    let picks = [];
    await session.withTransaction(async () => {
      // Add week fields to all picks
      await picksCollection.updateMany({}, { $set: { week } }, { session });

      const picksCursor = picksCollection.find({}, { session });
      picks = await picksCursor.toArray();
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

      // Step 3: Fill missing picks (skip week 1 — no penalty at start of season)
      const blankPicks = [];
      if (parseInt(week) > 1) {
        for (const username of usernames) {
          const userPicks = picksByUser[username] || [];
          const typesPicked = userPicks.map(p => p.type);
          const allTypes = ['favorite', 'dog', 'over', 'under', 'gotw'];

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
            blankPicks.push(blankPick);
          }
        }
      }

      // Process picks (add results etc) — skips any pick that already has result set
      const processedPicks = await processPicks(season, week, weekType, picksNoId);

      // Only insert picks not already copied to Picks_History by real-time scoring.
      const toInsert = processedPicks.filter(p => p.result !== undefined && !p.scoredAt);
      const allToInsert = [...toInsert, ...blankPicks];
      if (allToInsert.length > 0) {
        await picksHistoryCollection.insertMany(allToInsert, { session });
      }

      // Send backup text BEFORE clearing picks — if it fails, abort the transaction
      await sendPicksBackup(picks, parseInt(week));

      // Clear Picks for the new week
      await picksCollection.deleteMany({}, { session });

      // Backup Games to Games_History
      const games = await gamesCollection.find({}, { session }).toArray();
      if (games.length > 0) {
        await gamesHistoryCollection.insertMany(games, { session });
        await gamesCollection.deleteMany({}, { session });
      }

      // Load new games from ESPN API for the upcoming week
      let newGames = await getGames(season, weekType, week);
      newGames = newGames.map(game => ({ ...game, season, week }));
      if (newGames.length > 0) {
        await gamesCollection.insertMany(newGames, { session });
      }

      // Increment week and persist to Config
      week = parseInt(week) + 1;
      await configCollection.updateOne(
        { _id: 'current' },
        { $set: { season, week, weekType } },
        { session, upsert: true }
      );

      console.log(`Tuesday job completed for season ${season}, week ${week - 1} → now week ${week}`);
    });

    await fetchAndStoreRecords(client.db('SlackGambling'));

    // Clear stale injury, weather, depth chart, and stats caches for the new week
    await db.collection('Injury_Cache').deleteMany({});
    await db.collection('Weather_Cache').deleteMany({});
    await db.collection('DepthChart_Cache').deleteMany({});
    await db.collection('Stats_Cache').deleteMany({});
    await db.collection('ATS_Cache').deleteMany({});
    await db.collection('Line_Movements').deleteMany({});

    const successMsg = `Tuesday job success for season ${season}, week ${week}`;
    await logCronRun('Tuesday Job', 'success', successMsg);
    return successMsg;
  } catch (error) {
    console.error('Error during Tuesday job transaction:', error);
    await logCronRun('Tuesday Job', 'error', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

export async function fetchAndStoreTeamIds(db) {
  try {
    const res = await axios.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32");
    const teams = res.data.sports?.[0]?.leagues?.[0]?.teams || [];
    const collection = db.collection('Team_IDs');
    const ops = teams.map(({ team }) => ({
      updateOne: {
        filter: { team: team.displayName },
        update: { $set: { team: team.displayName, espnId: team.id } },
        upsert: true,
      },
    }));
    if (ops.length > 0) await collection.bulkWrite(ops);
    console.log(`Team IDs updated (${ops.length} teams).`);
  } catch (err) {
    console.error("Failed to fetch/store team IDs:", err);
  }
}

export async function fetchAndStoreRecords(db) {
  try {
    const res = await axios.get("https://site.api.espn.com/apis/v2/sports/football/nfl/standings");
    const collection = db.collection('Team_Records');
    const ops = [];
    for (const conference of res.data.children || []) {
      for (const entry of conference.standings?.entries || []) {
        const team = entry.team?.displayName;
        if (!team) continue;
        const stat = (s) => entry.stats?.find(x => x.name === s)?.displayValue ?? "0";
        const wins = stat("wins");
        const losses = stat("losses");
        const ties = stat("ties");
        const record = ties !== "0" ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
        ops.push({
          updateOne: {
            filter: { team },
            update: { $set: { team, record, updatedAt: new Date() } },
            upsert: true,
          },
        });
      }
    }
    if (ops.length > 0) await collection.bulkWrite(ops);
    console.log(`Team records updated (${ops.length} teams).`);
  } catch (err) {
    console.error("Failed to fetch/store team records:", err);
  }
}

async function sendPicksBackup(picks, week) {
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
}

export async function removeDuplicates(db) {
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
