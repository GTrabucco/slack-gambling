import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

export async function logCronRun(jobName, status, message) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        await client.db('SlackGambling').collection('Cron_Logs').insertOne({
            jobName,
            status,
            message,
            timestamp: new Date(),
        });
    } catch (e) {
        console.error('Failed to write cron log:', e);
    } finally {
        await client.close();
    }
}
