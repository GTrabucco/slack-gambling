const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
    'https://slackgambling-babd5a00a8e8.herokuapp.com',
    'http://localhost:3000' 
  ];
  
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

const uri = process.env.MONGODB_URI;
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

app.use(express.json());

app.get('/api/games', async (req, res) => {
    try {
        const db = client.db('SlackGambling'); 
        const data = await db.collection('Games').find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;
    try {
        const db = client.db('SlackGambling');
        const filter = { username: username }
        const updateUser = {
            $set: {
                password: newPassword
            }
        }

        await db.collection('Users').updateOne(filter, updateUser);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error logging in' });
    }
})

app.post('/api/update-pick-history', async (req, res) => {
    const { id, result } = req.body;
    try {
        const db = client.db('SlackGambling');
        const filter = { _id: new ObjectId(id) }
        const updatePicksHistory = {
            $set: {
                result: parseInt(result, 10)
            }
        }

        console.log(id, result)
        await db.collection('Picks_History').updateOne(filter, updatePicksHistory);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error logging in' });
    }
})

app.post('/api/submit-picks', async (req, res) => {
    const { username, pickType, gameId, value } = req.body;
    if (!username || !pickType || !gameId || !value) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await client.connect();
        const db = client.db('SlackGambling');
        const picksCollection = db.collection('Picks');
        const filter = { username: username, type: pickType };
        const existingPick = await picksCollection.findOne(filter);
        if (existingPick && existingPick.gameId === gameId && existingPick.text === value) {
            await picksCollection.deleteOne(filter);
            console.log(`Deleted pick for username: ${username}, type: ${pickType}`);
            return res.status(200).json({ message: 'Pick deleted as it matched the existing entry' });
        }

        const update = {
            $set: {
                gameId: gameId,
                text: value,
                username: username,
                type: pickType,
                createdAt: new Date()
            }
        };

        const options = { upsert: true };
        const result = await picksCollection.updateOne(filter, update, options);
        if (result.upsertedCount > 0) {
            console.log(`Inserted new pick for username: ${username}, type: ${pickType}`);
        } else if (result.matchedCount > 0) {
            console.log(`Updated pick for username: ${username}, type: ${pickType}`);
        }
    } catch (error) {
        console.error('Error updating/inserting pick:', error);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/api/get-weekly-picks', async (req, res) => {
    try {
        const { username } = req.query;
        const db = client.db('SlackGambling'); 
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
        const db = client.db('SlackGambling'); 
        const data = await db.collection('Picks_History').find({username: username}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-all-pick-history', async (req, res) => {
    try {
        const db = client.db('SlackGambling'); 
        const data = await db.collection('Picks_History').find({}).toArray();
        res.json(data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error fetching data from MongoDB' });
    }
});

app.get('/api/get-standings', async (req, res) => {
    try {
        const db = client.db('SlackGambling'); 

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

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = client.db('SlackGambling');
        const user = await db.collection('Users').findOne({ username: username });

        if (user) {
            const passwordMatch = password == user.password;
            if (passwordMatch) {
                const token = username
                user.password = "*******"
                res.json({
                    message: 'Login successful',
                    user: user, 
                    token: token
                });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

app.route("/").get(function (req, res) {
    res.redirect("/login");
});