import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import fridayJob from './fridayjobnew.js';
import tuesdayJob from './tuesdayjobnew.js';
import sundayReminder from './sundayremindernew.js';
import { weatherAgent } from './weatherAgent.js';
import RateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEASON = "2025"

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
    } catch (error) {
        console.error(error);
    }
}

connectDB();

cron.schedule("0 9 * * 0", async () => 
    {
        try {
            const result = await sundayReminder();
        } catch (error) {
            console.error("Failed to send Sunday reminder:", error);
        }
    },
    {
        timezone: "America/New_York"
    }
);

app.get("/api/get-weather-description", async (req, res) => {
    try {
        const { details } = req.query;
        const result = await weatherAgent(details);
        res.json(result );
    } catch (error) {
        console.error('Weather Agent Error:', error);
        res.status(500).json({ error: 'Weather Agent failed', details: error.message });
    }
});

app.get('/api/games', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME);
        const data = await db.collection('Games').find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
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
        const data = await db.collection('Games').find({gameId: gameId}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/backup-picks', async (req, res) => {
    try {
        const picksToSave = await picksCollection.find({}).toArray();
        if (picksToSave.length === 0) return res.status(404).send("No picks to backup.");

        const now = new Date();
        const fileName = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${now.getFullYear()}.txt`;
        const fileContent = JSON.stringify(picksToSave, null, 2);

        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "text/plain");

        res.send(fileContent);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to create backup");
    }
});


app.post('/api/tuesday-job', async (req, res) => {
    try {
        const { season, week, weekType } = req.body;
        const result = await tuesdayJob(season, week, weekType);
        res.json({ message: 'Tuesday job executed successfully', result });
    } catch (error) {
        console.error('Tuesday Job Error:', error);
        res.status(500).json({ error: 'Tuesday job failed', details: error.message });
    }
});

app.post('/api/friday-job', async (req, res) => {
    try {
        const { season, week, weekType } = req.body;
        const result = await fridayJob(season, week, weekType);
        res.json({ message: 'Friday job executed successfully', result });
    } catch (error) {
        console.error('Friday Job Error:', error);
        res.status(500).json({ error: 'Friday job failed', details: error.message });
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

app.post('/api/submit-picks', async (req, res) => {
    const { username, homeTeam, awayTeam, type, gameId, value, text } = req.body;
    if (!username || !homeTeam || !awayTeam || !type || !gameId || !value || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = client.db(DATABASE_NAME);
        const picksCollection = db.collection('Picks');
        const filter = { username: username, type: type };
        const existingPick = await picksCollection.findOne(filter);
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
                season: SEASON
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
        const { username, receiveSundayReminder, displayName, phoneNumber } = req.body;
        const db = client.db(DATABASE_NAME);
        const userDetails = db.collection('User_Details');
        const filter = { username: username };

        const update = {
            $set: {
                username: username,
                receiveSundayReminder: receiveSundayReminder,
                displayName: displayName,
                phoneNumber: phoneNumber
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
