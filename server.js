import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import tuesdayJob, { fetchAndStoreTeamIds, fetchAndStoreRecords } from './tuesdayjobnew.js';
import sundayReminder from './sundayremindernew.js';
import refreshJob from './refreshjobnew.js';
import twilio from 'twilio';
import RateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const allowedOrigins = [
    'https://slackgambling.com',
    'https://www.slackgambling.com',
    'https://slackgambling-babd5a00a8e8.herokuapp.com',
    'http://localhost:3000'
];

const limiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});

app.use(limiter);
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client/build')));

const uri = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const client = new MongoClient(uri);

const connectDB = async () => {
    try {
        await client.connect();
        console.log('MongoDB connected');
        const db = client.db(DATABASE_NAME);
        const teamIdCount = await db.collection('Team_IDs').countDocuments();
        if (teamIdCount === 0) {
            console.log('Team_IDs collection empty — seeding...');
            await fetchAndStoreTeamIds(db);
        }
        const recordsCount = await db.collection('Team_Records').countDocuments();
        if (recordsCount === 0) {
            console.log('Team_Records collection empty — seeding...');
            await fetchAndStoreRecords(db);
        }
    } catch (error) {
        console.error(error);
    }
}

connectDB();

// Twilio alert helper for cron failures
const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
async function sendFailureAlert(jobName, error) {
    try {
        await twilioClient.messages.create({
            body: `🚨 ${jobName} failed: ${error.message}`,
            from: '+18334966404',
            to: process.env.ADMIN_PHONE_NUMBER,
        });
    } catch (e) {
        console.error('Failed to send failure alert via Twilio:', e);
    }
}

// MongoDB indexes
async function createIndexes() {
    try {
        const db = client.db(DATABASE_NAME);
        await db.collection('Picks').createIndex({ username: 1, type: 1 });
        await db.collection('Picks_History').createIndex({ username: 1, week: 1, season: 1 });
        await db.collection('Games').createIndex({ gameId: 1 });
        await db.collection('Games').createIndex({ week: 1 });
        console.log('MongoDB indexes created');
    } catch (e) {
        console.error('Failed to create indexes:', e);
    }
}
createIndexes();

// Strict rate limiter for sensitive routes
const submitLimiter = RateLimit({ windowMs: 15 * 60 * 1000, max: 60 });
const adminLimiter = RateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

cron.schedule("0 9 * * 0", async () => {
    try {
        const result = await sundayReminder();
    } catch (error) {
        console.error("Failed to send Sunday reminder:", error);
        await sendFailureAlert('Sunday Reminder', error);
    }
},
    {
        timezone: "America/New_York"
    }
);

// Tuesday 6am ET: process last week's picks and load full week of games
cron.schedule("0 6 * * 2", async () => {
    console.log("Running automatic Tuesday job...");
    try {
        await tuesdayJob();
    } catch (error) {
        console.error("Automatic Tuesday job failed:", error);
        await sendFailureAlert('Tuesday Job', error);
    }
},
    { timezone: "America/New_York" }
);

// Refresh lines: Mon–Sat at 8am and 6pm ET
cron.schedule("0 8,18 * * 1-6", async () => {
    try {
        await refreshJob();
    } catch (error) {
        console.error("Refresh job (Mon-Sat) failed:", error);
        await sendFailureAlert('Refresh Job (Mon-Sat)', error);
    }
},
    { timezone: "America/New_York" }
);

// Refresh lines: Sunday at 8am, 12pm, 3pm, 6pm ET
cron.schedule("0 8,12,15,18 * * 0", async () => {
    try {
        await refreshJob();
    } catch (error) {
        console.error("Refresh job (Sunday) failed:", error);
        await sendFailureAlert('Refresh Job (Sunday)', error);
    }
},
    { timezone: "America/New_York" }
);

app.get('/api/games', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('Games').find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.post('/api/games', adminLimiter, async (req, res) => {
    try {
        const { gameId, commence_time, home_team, away_team, home_spread, away_spread, over, under, season, week } = req.body;
        if (!home_team || !away_team || !commence_time) {
            return res.status(400).json({ error: 'home_team, away_team, and commence_time are required' });
        }
        const db = client.db(DATABASE_NAME);
        const game = { gameId: gameId || null, commence_time, home_team, away_team, home_spread: home_spread || null, away_spread: away_spread || null, over: over || null, under: under || null, season, week, isGotw: false };
        const result = await db.collection('Games').insertOne(game);
        res.json({ success: true, insertedId: result.insertedId });
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Error creating game' });
    }
});

app.put('/api/games/:id', adminLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { gameId, commence_time, home_team, away_team, home_spread, away_spread, over, under, season, week } = req.body;
        const db = client.db(DATABASE_NAME);
        await db.collection('Games').updateOne(
            { _id: new ObjectId(id) },
            { $set: { gameId, commence_time, home_team, away_team, home_spread: home_spread || null, away_spread: away_spread || null, over: over || null, under: under || null, season, week } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Error updating game' });
    }
});

app.put('/api/games/:id/gotw', adminLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const db = client.db(DATABASE_NAME);
        const game = await db.collection('Games').findOne({ _id: new ObjectId(id) });
        if (game?.isGotw) {
            // Already GOTW — unset it
            await db.collection('Games').updateOne({ _id: new ObjectId(id) }, { $set: { isGotw: false } });
        } else {
            // Set this as GOTW, clear all others
            await db.collection('Games').updateMany({}, { $set: { isGotw: false } });
            await db.collection('Games').updateOne({ _id: new ObjectId(id) }, { $set: { isGotw: true } });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting GOTW:', error);
        res.status(500).json({ error: 'Error setting game of the week' });
    }
});

app.delete('/api/games/:id', adminLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const db = client.db(DATABASE_NAME);
        await db.collection('Games').deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Error deleting game' });
    }
});

app.get('/api/games-history', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('Games_History').find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-game', async (req, res) => {
    try {
        const { gameId } = req.query;
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('Games').find({ gameId: gameId }).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.post('/api/tuesday-job', adminLimiter, async (req, res) => {
    try {
        const { season, week, weekType } = req.body || {};
        const result = await tuesdayJob(season, week, weekType);
        res.json({ message: 'Tuesday job executed successfully', result });
    } catch (error) {
        console.error('Tuesday Job Error:', error);
        res.status(500).json({ error: 'Tuesday job failed', details: error.message });
    }
});

app.get('/api/config', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const config = await db.collection('Config').findOne({ _id: 'current' });
        res.json(config || {});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching config' });
    }
});

app.post('/api/config', adminLimiter, async (req, res) => {
    try {
        const { season, week, weekType } = req.body;
        const db = client.db(DATABASE_NAME);
        await db.collection('Config').updateOne(
            { _id: 'current' },
            { $set: { season, week: parseInt(week), weekType: parseInt(weekType) } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating config' });
    }
});


app.get('/api/text-history', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const logs = await db.collection('Text_History').aggregate([
            { $sort: { Date: -1 } },
            { $limit: 200 },
            {
                $lookup: {
                    from: 'User_Details',
                    localField: 'Number',
                    foreignField: 'phoneNumber',
                    as: 'user',
                    pipeline: [{ $project: { username: 1 } }],
                }
            },
            {
                $addFields: {
                    Username: { $arrayElemAt: ['$user.username', 0] }
                }
            },
            { $project: { user: 0 } },
        ]).toArray();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching text history' });
    }
});

app.get('/api/cron-logs', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const logs = await db.collection('Cron_Logs').find({}).sort({ timestamp: -1 }).limit(100).toArray();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cron logs' });
    }
});

app.put('/api/cron-logs/:id/read', adminLimiter, async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const log = await db.collection('Cron_Logs').findOne({ _id: new ObjectId(req.params.id) });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        await db.collection('Cron_Logs').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { read: !log.read } }
        );
        res.json({ read: !log.read });
    } catch (error) {
        res.status(500).json({ error: 'Error toggling log read status' });
    }
});

app.get('/api/cron-logs/unread-errors/count', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const count = await db.collection('Cron_Logs').countDocuments({ status: 'error', read: { $ne: true } });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching unread error count' });
    }
});

app.post('/api/refresh-job', async (req, res) => {
    try {
        const result = await refreshJob();
        res.json({ message: 'Refresh job executed successfully', result });
    } catch (error) {
        console.error('Refresh Job Error:', error);
        res.status(500).json({ error: 'Refresh job failed', details: error.message });
    }
});

app.post('/api/sunday-reminder-job', async (req, res) => {
    try {
        const result = await sundayReminder();
        res.json({ message: 'Sunday reminder sent successfully', result });
    } catch (error) {
        console.error('Sunday Reminder Job Error:', error);
        res.status(500).json({ error: 'Sunday reminder failed', details: error.message });
    }
});

app.post('/api/report-issue', async (req, res) => {
    const { username, description } = req.body;
    const database = client.db(DATABASE_NAME);
    const collection = database.collection("Reports");
    const document = {
        username: username,
        createdAt: new Date(),
        description: description,
    };

    try {
        const result = await collection.insertOne(document);
        console.log(`Issue reported: ${result.insertedId}`);
        res.json({ success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
})

app.post('/api/close-report', async (req, res) => {
    const { id } = req.body;
    const database = client.db(DATABASE_NAME);
    const collection = database.collection("Reports");
    const filter = { _id: new ObjectId(id) };
    try {
        await collection.deleteOne(filter);
        console.log(`Report closed: ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
})

app.get('/api/get-reports', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('Reports').find({}).toArray();
        return res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/reports/count', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const count = await db.collection('Reports').countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching report count' });
    }
});

app.post('/api/update-pick-history', async (req, res) => {
    const { id, result } = req.body;
    try {
        const db = client.db(DATABASE_NAME);
        const filter = { _id: new ObjectId(id) }
        const updatePicksHistory = {
            $set: {
                result: parseInt(result, 10)
            }
        }

        await db.collection('Picks_History').updateOne(filter, updatePicksHistory);
        res.json({ success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error logging in' });
    }
})

app.delete('/api/picks/:id', adminLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const db = client.db(DATABASE_NAME);
        await db.collection('Picks').deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting pick:', error);
        res.status(500).json({ error: 'Error deleting pick' });
    }
});

app.post('/api/admin/picks', adminLimiter, async (req, res) => {
    try {
        const { username, gameId, homeTeam, awayTeam, type, value, text, season, week } = req.body;
        if (!username || !type || !gameId) {
            return res.status(400).json({ error: 'username, type, and gameId are required' });
        }
        const db = client.db(DATABASE_NAME);
        const filter = { username, type };
        const update = { $set: { username, gameId, homeTeam, awayTeam, type, value, text, season, week, createdAt: new Date() } };
        await db.collection('Picks').updateOne(filter, update, { upsert: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating pick:', error);
        res.status(500).json({ error: 'Error creating pick' });
    }
});

app.post('/api/remove-pick', async (req, res) => {
    const { gameId, pickType, username, text } = req.body;
    if (!pickType || !gameId || !text || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = client.db(DATABASE_NAME);
        const picksCollection = db.collection('Picks');
        const filter = { username: username, type: pickType };
        const existingPick = await picksCollection.findOne(filter);
        if (existingPick && existingPick.gameId === gameId && existingPick.text === text) {
            await picksCollection.deleteOne(filter);
            console.log(`Deleted pick for username: ${username}, type: ${pickType}, text: ${text}`);
            return res.status(200).json({ message: 'Pick deleted as it matched the existing entry' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing pick:', error);
    }
})

app.post('/api/submit-picks', submitLimiter, async (req, res) => {
    const { username, homeTeam, awayTeam, type, gameId, value, text } = req.body;
    if (!username || !homeTeam || !awayTeam || !type || !gameId || !value || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const VALID_TYPES = ['favorite', 'dog', 'over', 'under', 'gotw'];
    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid pick type' });
    }

    try {
        const db = client.db(DATABASE_NAME);
        const picksCollection = db.collection('Picks');
        const gamesCollection = db.collection('Games');

        // Validate the target game exists and hasn't started
        let targetGame;
        try {
            targetGame = await gamesCollection.findOne({ gameId: gameId });
        } catch (_) { /* invalid gameId */ }
        if (!targetGame) return res.status(400).json({ error: 'Game not found' });
        if (new Date(targetGame.commence_time) <= new Date()) {
            return res.status(400).json({ error: 'That game has already started — pick is locked' });
        }

        const config = await db.collection('Config').findOne({ _id: 'current' });
        const season = config?.season ?? null;
        const filter = { username: username, type: type };
        const existingPick = await picksCollection.findOne(filter);

        // If the user already has a pick of this type in a started game, block the change
        if (existingPick && existingPick.gameId !== gameId) {
            let existingGame;
            try {
                existingGame = await gamesCollection.findOne({ gameId: existingPick.gameId });
            } catch (_) { /* ignore */ }
            if (existingGame && new Date(existingGame.commence_time) <= new Date()) {
                return res.status(400).json({ error: `Your ${type} pick is locked — that game has already started` });
            }
        }

        if (existingPick && existingPick.gameId === gameId && existingPick.text === text) {
            await picksCollection.deleteOne(filter);
            console.log(`Deleted pick for username: ${username}, type: ${type}, text: ${text}`);
            return res.status(200).json({ message: 'Pick deleted as it matched the existing entry' });
        }

        const update = {
            $set: {
                gameId: gameId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                text: text,
                value: value,
                username: username,
                type: type,
                createdAt: new Date(),
                season: season
            }
        };

        const options = { upsert: true };
        const result = await picksCollection.updateOne(filter, update, options);
        if (result.upsertedCount > 0) {
            console.log(`Inserted new pick for username: ${username}, type: ${type}, text: ${text}`);
        } else if (result.matchedCount > 0) {
            console.log(`Updated pick for username: ${username}, type: ${type}, text: ${text}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating/inserting pick:', error);
    }
});

app.get('/api/get-weekly-picks', async (req, res) => {
    try {
        const { username } = req.query;
        const db = client.db(DATABASE_NAME);
        let data;
        if (username) {
            data = await db.collection('Picks').find({ username: username }).toArray();
        } else {
            data = await db.collection('Picks').find({}).toArray();
        }

        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/injuries', async (req, res) => {
    try {
        const { home, away, commenceTime } = req.query;
        if (!home || !away) return res.status(400).json({ error: 'home and away team names are required' });
        const db = client.db(DATABASE_NAME);
        const teamIds = await db.collection('Team_IDs').find({ team: { $in: [home, away] } }).toArray();
        const idMap = {};
        for (const t of teamIds) idMap[t.team] = t.espnId;

        const computeTTL = () => {
            if (!commenceTime) return 4 * 60 * 60 * 1000; // default 4h
            const msUntilGame = new Date(commenceTime).getTime() - Date.now();
            if (msUntilGame <= 24 * 60 * 60 * 1000) return 30 * 60 * 1000;       // game day: 30 min
            if (msUntilGame <= 3 * 24 * 60 * 60 * 1000) return 2 * 60 * 60 * 1000; // within 3 days: 2h
            return 6 * 60 * 60 * 1000;                                              // > 3 days: 6h
        };
        const CACHE_TTL_MS = computeTTL();
        const INJURY_STATUSES = new Set(['Out', 'Doubtful', 'Questionable', 'Probable', 'IR', 'PUP', 'NFI', 'Suspended']);
        const cache = db.collection('Injury_Cache');

        const fetchInjuries = async (teamName) => {
            const espnId = idMap[teamName];
            if (!espnId) return [];

            // Check cache first
            const cached = await cache.findOne({ team: teamName });
            if (cached && (Date.now() - new Date(cached.cachedAt).getTime()) < CACHE_TTL_MS) {
                return cached.injuries;
            }

            try {
                const listJson = await fetch(
                    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/${espnId}/injuries?limit=100`
                ).then(r => r.json());

                const refs = (listJson.items || []).map(i => i['$ref']).filter(Boolean);
                if (refs.length === 0) {
                    await cache.updateOne({ team: teamName }, { $set: { team: teamName, injuries: [], cachedAt: new Date() } }, { upsert: true });
                    return [];
                }

                const details = await Promise.all(
                    refs.map(ref => fetch(ref).then(r => r.json()).catch(() => null))
                );

                const injured = details.filter(d => d && INJURY_STATUSES.has(d.status));

                const athletes = await Promise.all(
                    injured.map(d => {
                        const ref = d.athlete?.['$ref'];
                        return ref ? fetch(ref).then(r => r.json()).catch(() => null) : Promise.resolve(null);
                    })
                );

                const STATUS_ORDER = { "IR": 0, "Out": 1, "Doubtful": 2, "Questionable": 3, "Probable": 4 };
                const injuries = injured.map((inj, i) => ({
                    name: athletes[i]?.displayName ?? '—',
                    position: athletes[i]?.position?.abbreviation ?? '—',
                    status: inj.status ?? '—',
                    type: inj.details?.type ?? '—',
                })).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));

                await cache.updateOne(
                    { team: teamName },
                    { $set: { team: teamName, injuries, cachedAt: new Date() } },
                    { upsert: true }
                );

                return injuries;
            } catch {
                // On ESPN failure return stale cache if available
                return cached?.injuries ?? [];
            }
        };

        const [homeInjuries, awayInjuries] = await Promise.all([
            fetchInjuries(home),
            fetchInjuries(away),
        ]);

        res.json({ home: homeInjuries, away: awayInjuries });
    } catch (error) {
        console.error('Error fetching injuries:', error);
        res.status(500).json({ error: 'Error fetching injuries' });
    }
});

app.get('/api/depthchart', async (req, res) => {
    try {
        const { home, away, commenceTime } = req.query;
        if (!home || !away) return res.status(400).json({ error: 'home and away team names are required' });
        const db = client.db(DATABASE_NAME);

        const teamIds = await db.collection('Team_IDs').find({ team: { $in: [home, away] } }).toArray();
        const idMap = {};
        for (const t of teamIds) idMap[t.team] = t.espnId;

        const config = await db.collection('Config').findOne({ _id: 'current' });
        const season = config?.season ?? 2026;

        const computeTTL = () => {
            if (!commenceTime) return 4 * 60 * 60 * 1000;
            const msUntilGame = new Date(commenceTime).getTime() - Date.now();
            if (msUntilGame <= 24 * 60 * 60 * 1000) return 30 * 60 * 1000;
            if (msUntilGame <= 3 * 24 * 60 * 60 * 1000) return 2 * 60 * 60 * 1000;
            return 6 * 60 * 60 * 1000;
        };
        const CACHE_TTL_MS = computeTTL();
        const cache = db.collection('DepthChart_Cache');

        const fetchDepthChart = async (teamName) => {
            const espnId = idMap[teamName];
            if (!espnId) return [];

            const cached = await cache.findOne({ team: teamName });
            if (cached && (Date.now() - new Date(cached.cachedAt).getTime()) < CACHE_TTL_MS) {
                return cached.data;
            }

            try {
                const dcJson = await fetch(
                    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/teams/${espnId}/depthcharts`
                ).then(r => r.json());

                // Collect starter athlete refs grouped by formation
                const formations = [];
                for (const item of (dcJson.items || [])) {
                    const positions = [];
                    for (const [posKey, posData] of Object.entries(item.positions || {})) {
                        const abbr = posData.position?.abbreviation ?? '—';
                        if (posKey === 'wr') {
                            // Group by slot, take ranks 1-3 per slot → all shown as WR
                            const bySlot = {};
                            for (const a of (posData.athletes || [])) {
                                if (!a.athlete?.['$ref'] || a.rank > 3) continue;
                                if (!bySlot[a.slot]) bySlot[a.slot] = [];
                                bySlot[a.slot].push(a);
                            }
                            const slots = Object.keys(bySlot).map(Number).sort((a, b) => a - b);
                            slots.forEach((slot) => {
                                bySlot[slot].sort((a, b) => a.rank - b.rank).forEach(a => {
                                    positions.push({
                                        positionAbbr: 'WR',
                                        athleteRef: a.athlete['$ref'],
                                        rank: a.rank,
                                    });
                                });
                            });
                        } else {
                            const starters = posData.athletes?.filter(a => a.rank <= 2 && a.athlete?.['$ref']) ?? [];
                            starters.sort((a, b) => a.rank - b.rank).forEach(a => {
                                positions.push({
                                    positionAbbr: abbr,
                                    athleteRef: a.athlete['$ref'],
                                    rank: a.rank,
                                });
                            });
                        }
                    }
                    // Normalize ESPN formation names to readable labels
                    const rawName = (item.name || '').toLowerCase();
                    let label;
                    if (rawName.includes('special')) label = 'Special Teams';
                    else if (rawName.match(/\d(wr|te|rb|hb)/i) || rawName.includes('offense') || rawName.includes('shotgun') || rawName.includes('pistol') || rawName.includes('i-form') || rawName.includes('wildcat')) label = 'Offense';
                    else label = 'Defense';

                    if (positions.length) formations.push({ name: label, positions });
                }

                // Batch-resolve unique athlete refs
                const allRefs = [...new Set(formations.flatMap(f => f.positions.map(p => p.athleteRef)))];
                const athleteMap = {};
                await Promise.all(allRefs.map(async ref => {
                    const a = await fetch(ref).then(r => r.json()).catch(() => null);
                    if (a) athleteMap[ref] = a.displayName ?? a.fullName ?? '—';
                }));

                const data = formations.map(f => ({
                    name: f.name,
                    positions: f.positions.map(p => ({
                        position: p.positionAbbr,
                        player: athleteMap[p.athleteRef] ?? '—',
                        rank: p.rank,
                    })),
                }));

                // Merge formations with the same label, deduplicating by position+rank
                const ORDER = { 'Offense': 0, 'Defense': 1, 'Special Teams': 2 };
                const merged = [];
                const seen = {};
                for (const f of data) {
                    if (!seen[f.name]) {
                        seen[f.name] = { name: f.name, positions: [], posSet: new Set() };
                        merged.push(seen[f.name]);
                    }
                    for (const p of f.positions) {
                        const key = `${p.position}__${p.rank}`;
                        if (!seen[f.name].posSet.has(key)) {
                            seen[f.name].posSet.add(key);
                            seen[f.name].positions.push(p);
                        }
                    }
                }
                const OFFENSE_POS_ORDER = ['QB','RB','HB','FB','WR','TE','LT','LG','C','RG','RT'];
                const sortedData = merged
                    .map(({ posSet, ...rest }) => {
                        if (rest.name === 'Offense') {
                            rest.positions = rest.positions.slice().sort((a, b) => {
                                const ai = OFFENSE_POS_ORDER.indexOf(a.position);
                                const bi = OFFENSE_POS_ORDER.indexOf(b.position);
                                if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                                return a.rank - b.rank;
                            });
                        } else {
                            // For defense/special teams, sort by position then rank
                            rest.positions = rest.positions.slice().sort((a, b) =>
                                a.position.localeCompare(b.position) || a.rank - b.rank
                            );
                        }
                        return rest;
                    })
                    .sort((a, b) => (ORDER[a.name] ?? 99) - (ORDER[b.name] ?? 99));

                await cache.updateOne(
                    { team: teamName },
                    { $set: { team: teamName, data: sortedData, cachedAt: new Date() } },
                    { upsert: true }
                );

                return sortedData;
            } catch {
                return cached?.data ?? [];
            }
        };

        const [homeData, awayData] = await Promise.all([
            fetchDepthChart(home),
            fetchDepthChart(away),
        ]);

        res.json({ home: homeData, away: awayData });
    } catch (error) {
        console.error('Error fetching depth chart:', error);
        res.status(500).json({ error: 'Error fetching depth chart' });
    }
});

app.get('/api/weather', async (req, res) => {
    try {
        const { city, date, lat, lon, timezone, commenceTime } = req.query;
        if (!city || !date || !lat || !lon || !timezone) {
            return res.status(400).json({ error: 'city, date, lat, lon, and timezone are required' });
        }

        const db = client.db(DATABASE_NAME);
        const cache = db.collection('Weather_Cache');
        const cacheKey = `${city}__${date}`;

        const computeTTL = () => {
            if (!commenceTime) return 2 * 60 * 60 * 1000; // default 2h
            const msUntilGame = new Date(commenceTime).getTime() - Date.now();
            if (msUntilGame <= 24 * 60 * 60 * 1000) return 30 * 60 * 1000;        // game day: 30 min
            if (msUntilGame <= 3 * 24 * 60 * 60 * 1000) return 2 * 60 * 60 * 1000; // within 3 days: 2h
            return 6 * 60 * 60 * 1000;                                              // > 3 days: 6h
        };
        const CACHE_TTL_MS = computeTTL();

        const cached = await cache.findOne({ key: cacheKey });
        if (cached && (Date.now() - new Date(cached.cachedAt).getTime()) < CACHE_TTL_MS) {
            return res.json(cached.data);
        }

        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', lat);
        url.searchParams.set('longitude', lon);
        url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,windspeed_10m');
        url.searchParams.set('timezone', timezone);
        url.searchParams.set('start_date', date);
        url.searchParams.set('end_date', date);
        url.searchParams.set('temperature_unit', 'fahrenheit');

        const weatherRes = await fetch(url.toString()).then(r => r.json());
        const { time, temperature_2m, precipitation_probability, windspeed_10m } = weatherRes.hourly;

        const data = time.map((t, i) => ({
            time: t,
            temperature: temperature_2m[i],
            precipitation: precipitation_probability[i],
            wind: windspeed_10m[i],
        }));

        await cache.updateOne(
            { key: cacheKey },
            { $set: { key: cacheKey, data, cachedAt: new Date() } },
            { upsert: true }
        );

        res.json(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({ error: 'Error fetching weather' });
    }
});

app.get('/api/team-ids', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const docs = await db.collection('Team_IDs').find({}).sort({ team: 1 }).toArray();
        res.json(docs);
    } catch (error) {
        console.error('Error fetching team IDs:', error);
        res.status(500).json({ error: 'Error fetching team IDs' });
    }
});

app.put('/api/team-ids/:team', adminLimiter, async (req, res) => {
    try {
        const { team } = req.params;
        const { espnId } = req.body;
        if (!espnId) return res.status(400).json({ error: 'espnId is required' });
        const db = client.db(DATABASE_NAME);
        await db.collection('Team_IDs').updateOne(
            { team },
            { $set: { espnId: String(espnId) } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating team ID:', error);
        res.status(500).json({ error: 'Error updating team ID' });
    }
});

app.get('/api/records', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const docs = await db.collection('Team_Records').find({}).toArray();
        const map = {};
        for (const doc of docs) map[doc.team] = doc.record;
        res.json(map);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: 'Error fetching records' });
    }
});

app.get('/api/records/all', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const docs = await db.collection('Team_Records').find({}).sort({ team: 1 }).toArray();
        res.json(docs);
    } catch (error) {
        console.error('Error fetching all records:', error);
        res.status(500).json({ error: 'Error fetching all records' });
    }
});

app.put('/api/records/:team', adminLimiter, async (req, res) => {
    try {
        const team = decodeURIComponent(req.params.team);
        const { record } = req.body;
        if (!record) return res.status(400).json({ error: 'record is required' });
        const db = client.db(DATABASE_NAME);
        await db.collection('Team_Records').updateOne(
            { team },
            { $set: { team, record, updatedAt: new Date() } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: 'Error updating record' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const config = await db.collection('Config').findOne({ _id: 'current' });
        const season = req.query.season || config?.season;
        const filter = season ? { season } : {};

        const picks = await db.collection('Picks_History').find(filter).toArray();

        const userTotals = {};
        const userGotwWins = {};
        const userZeroWeeks = {};
        const userPerfectWeeks = {};
        const userWinningWeeks = {};
        const perfectScore = parseInt(season) >= 2026 ? 5 : 4;
        const worstScore = parseInt(season) >= 2026 ? -5 : -4;

        // Group picks by user then by week to compute weekly stats
        const byUserWeek = {};
        for (const pick of picks) {
            if (!userTotals[pick.username]) userTotals[pick.username] = 0;
            userTotals[pick.username] += pick.result || 0;

            if (pick.type === 'gotw' && (pick.result || 0) > 0) {
                userGotwWins[pick.username] = (userGotwWins[pick.username] || 0) + 1;
            }

            const key = `${pick.username}||${pick.week}`;
            if (!byUserWeek[key]) byUserWeek[key] = 0;
            byUserWeek[key] += pick.result || 0;
        }

        for (const [key, weekTotal] of Object.entries(byUserWeek)) {
            const username = key.split('||')[0];
            if (weekTotal === worstScore) {
                userZeroWeeks[username] = (userZeroWeeks[username] || 0) + 1;
            }
            if (weekTotal === perfectScore) {
                userPerfectWeeks[username] = (userPerfectWeeks[username] || 0) + 1;
            }
            if (weekTotal > 0) {
                userWinningWeeks[username] = (userWinningWeeks[username] || 0) + 1;
            }
        }

        const users = await db.collection('User_Details').find({}).project({ username: 1, displayName: 1 }).toArray();
        const displayMap = {};
        for (const u of users) displayMap[u.username] = u.displayName || u.username.split('@')[0];

        const sorted = Object.entries(userTotals)
            .map(([username, score]) => ({
                displayName: displayMap[username] || username.split('@')[0],
                score,
                gotwWins: userGotwWins[username] || 0,
                zeroWeeks: userZeroWeeks[username] || 0,
                perfectWeeks: userPerfectWeeks[username] || 0,
                winningWeeks: userWinningWeeks[username] || 0,
            }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (parseInt(season) >= 2026 && b.gotwWins !== a.gotwWins) return b.gotwWins - a.gotwWins;
                if (a.zeroWeeks !== b.zeroWeeks) return a.zeroWeeks - b.zeroWeeks;
                if (b.perfectWeeks !== a.perfectWeeks) return b.perfectWeeks - a.perfectWeeks;
                return b.winningWeeks - a.winningWeeks;
            });

        res.json(sorted);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Error fetching leaderboard' });
    }
});

app.get('/api/get-pick-history', async (req, res) => {
    try {
        const { season, username } = req.query;
        const db = client.db(DATABASE_NAME);

        const filter = {};
        if (season) filter.season = season;
        if (username) filter.username = username;

        const data = await db.collection('Picks_History').find(filter).toArray();
        return res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});


app.get('/api/userdetails', async (req, res) => {
    try {
        const { username } = req.query;
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('User_Details').find({ username: username }).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.delete('/api/users/:username', adminLimiter, async (req, res) => {
    try {
        const { username } = req.params;
        const db = client.db(DATABASE_NAME);
        await db.collection('User_Details').deleteOne({ username });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

app.get('/api/get-users', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('User_Details').find({}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.post('/api/has-paid', async (req, res) => {
    try {
        const { username } = req.body;
        const db = client.db(DATABASE_NAME);
        const userDetails = db.collection('User_Details');
        const filter = { username: username };

        const update = {
            $set: {
                hasPaid: true
            }
        };

        const options = { upsert: true };
        await userDetails.updateOne(filter, update, options);
        console.log(`Updated hasPaid for username: ${username}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user details:', error);
    }
});

app.post('/api/update-userdetails', async (req, res) => {
    try {
        const { username, receiveSundayReminder, displayName, phoneNumber, hasPaid } = req.body;
        const db = client.db(DATABASE_NAME);
        const userDetails = db.collection('User_Details');
        const filter = { username: username };

        const update = {
            $set: {
                username: username,
                receiveSundayReminder: receiveSundayReminder,
                displayName: displayName,
                phoneNumber: phoneNumber,
                hasPaid: !!hasPaid,
            }
        };

        const options = { upsert: true };
        await userDetails.updateOne(filter, update, options);
        console.log(`Updated Details for username: ${username}, receiveSundayReminder: ${receiveSundayReminder}, displayName: ${displayName}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user details:', error);
    }
});

app.post('/api/set-cookie', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});
