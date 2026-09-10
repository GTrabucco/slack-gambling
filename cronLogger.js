import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Reuse a single pooled connection instead of opening/closing a fresh
// MongoDB connection on every log write. logCronRun is called frequently
// (once per scored pick, per failure alert, etc.), and under concurrent
// load repeatedly opening new connections can exhaust the connection
// budget / spike latency enough to bring the whole app down.
let client;
let connectPromise;

async function getClient() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI);
    }
    if (!connectPromise) {
        connectPromise = client.connect().catch((e) => {
            // Allow retrying on the next call if the initial connect failed.
            connectPromise = null;
            throw e;
        });
    }
    await connectPromise;
    return client;
}

export async function logCronRun(jobName, status, message) {
    try {
        const c = await getClient();
        await c.db('SlackGambling').collection('Cron_Logs').insertOne({
            jobName,
            status,
            message,
            timestamp: new Date(),
        });
    } catch (e) {
        console.error('Failed to write cron log:', e);
    }
}
