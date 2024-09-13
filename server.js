const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
    'https://slackgambling.org',            
    'https://www.slackgambling.org',        
    'https://slackgambling-babd5a00a8e8.herokuapp.com', 
    'http://localhost:3000'                
];
  
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
const connectDB = async ()=>{
    try
    {
        await client.connect();
    }
    catch(error)
    {
        console.log(error)
    }
}

connectDB();

app.get('/api/games', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME); 
        const data = await db.collection('Games').find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
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

app.post('/api/submit-picks', async (req, res) => {
    const { username, homeTeam, awayTeam, pickType, gameId, value, text } = req.body;
    console.log(req.body)
    if (!username || !homeTeam || !awayTeam || !pickType || !gameId || !value || !text) {
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

        const update = {
            $set: {
                gameId: gameId,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                text: text,
                value: value,
                username: username,
                type: pickType,
                createdAt: new Date()
            }
        };

        const options = { upsert: true };
        const result = await picksCollection.updateOne(filter, update, options);
        if (result.upsertedCount > 0) {
            console.log(`Inserted new pick for username: ${username}, type: ${pickType}, text: ${text}`);
        } else if (result.matchedCount > 0) {
            console.log(`Updated pick for username: ${username}, type: ${pickType}, text: ${text}`);
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
        const data = await db.collection('Picks').find({username: username}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-pick-history', async (req, res) => {
    try {
        const { username } = req.query;
        const db = client.db(DATABASE_NAME); 
        const data = await db.collection('Picks_History').find({username: username}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-all-pick-history', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME); 
        const data = await db.collection('Picks_History').find({}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-standings', async (req, res) => {
    try {
        const db = client.db(DATABASE_NAME); 

        const pipeline = [
            {
              $group: {
                _id: "$username",
                resultSum: { $sum: "$result" }
              }
            },
            {
              $project: {
                _id: 0,
                username: "$_id",
                resultSum: 1
              }
            },
            {
              $sort: {
                resultSum: -1
              }
            }
          ];

        const picksHistoryCollection = db.collection('Picks_History');
        const results = await picksHistoryCollection.aggregate(pipeline).toArray();
        res.json(results);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});