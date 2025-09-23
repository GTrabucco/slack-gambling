import { MongoClient } from "mongodb";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

async function sundayReminder() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const twilioClient = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const users = db.collection("User_Details");
    const textHistory = db.collection("Text_History");

    const reminderUsers = await users
      .find(
        { receiveSundayReminder: true },
        { projection: { phoneNumber: 1 } }
      )
      .toArray();

    for (const user of reminderUsers) {
      if (!user.phoneNumber) continue;
      try {
        await twilioClient.messages.create({
          body: "Reminder to make your picks. Visit https://www.SlackGambling.com to view/make your picks",
          from: "+18334966404",
          to: user.phoneNumber,
        });
        await textHistory.insertOne({
          Date: new Date(),
          Number: user.phoneNumber,
          Status: "Success",
        });
      } catch (err) {
        await textHistory.insertOne({
          Date: new Date(),
          Number: user.phoneNumber,
          Status: "Error",
        });
      }
    }

    console.log("Sunday Reminder Sent");
  } catch (error) {
    console.error("Error sending reminders:", error);
  } finally {
    await client.close();
  }
}

export default sundayReminder;
