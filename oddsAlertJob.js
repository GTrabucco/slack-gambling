import { MongoClient } from "mongodb";
import twilio from "twilio";
import dotenv from "dotenv";
import { logCronRun } from "./cronLogger.js";
dotenv.config();

// A pick's `text`/`value`/`homeTeam`/`awayTeam` fields are set at the moment the
// pick is locked in (see /api/submit-picks in server.js). `value` is always the
// signed spread number for the specific team the user picked (negative = favorite,
// positive = underdog) or the total number for over/under picks. "gotw" picks reuse
// the same shape but can represent either a spread or a total pick, distinguished by
// whether the text contains "Over"/"Under".
function isTotalPick(pick) {
  return pick.type === "over" || pick.type === "under" || /\b(Over|Under)\b/.test(pick.text || "");
}

function isOverPick(pick) {
  return pick.type === "over" || /\bOver\b/.test(pick.text || "");
}

// Positive delta == the market has moved in the bettor's favor since they locked their pick:
// - Spread picks: their team's current spread is better (needs to win by less / gets more points).
// - Over picks: the total has dropped (easier to clear).
// - Under picks: the total has risen (easier to stay under).
function computeFavorableDelta(pick, game) {
  if (!game) return null;

  if (isTotalPick(pick)) {
    const locked = Number(pick.value);
    const current = Number(game.over);
    if (!Number.isFinite(locked) || !Number.isFinite(current)) return null;
    return isOverPick(pick) ? locked - current : current - locked;
  }

  const pickedHome = !!(pick.text && pick.homeTeam && pick.text.includes(pick.homeTeam));
  const locked = Number(pick.value);
  const current = Number(pickedHome ? game.home_spread : game.away_spread);
  if (!Number.isFinite(locked) || !Number.isFinite(current)) return null;
  return current - locked;
}

export default async function checkOddsAlerts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    await client.connect();
    const db = client.db("SlackGambling");
    const userDetails = db.collection("User_Details");
    const picksCollection = db.collection("Picks");
    const gamesCollection = db.collection("Games");
    const textHistory = db.collection("Text_History");

    const alertUsers = await userDetails
      .find({ oddsAlertEnabled: true, phoneNumber: { $exists: true, $ne: "" } })
      .toArray();

    if (alertUsers.length === 0) {
      await logCronRun("Odds Alert", "info", "No users have odds alerts enabled, skipping.");
      return "No users have odds alerts enabled.";
    }

    const now = new Date();
    let sentCount = 0;
    const notifications = [];

    for (const user of alertUsers) {
      const threshold = Number(user.oddsAlertThreshold);
      if (!Number.isFinite(threshold) || threshold <= 0) continue;

      const picks = await picksCollection
        .find({ username: user.username, oddsAlertSent: { $ne: true } })
        .toArray();

      for (const pick of picks) {
        const game = await gamesCollection.findOne({ gameId: pick.gameId });
        if (!game || new Date(game.commence_time) <= now) continue;

        const delta = computeFavorableDelta(pick, game);
        if (delta === null || delta < threshold) continue;

        try {
          await twilioClient.messages.create({
            body: `Line movement alert: your pick "${pick.text}" has shifted in your favor by ${delta.toFixed(1)} points. Visit https://www.SlackGambling.com for details.`,
            from: "+18334966404",
            to: user.phoneNumber,
          });
          await textHistory.insertOne({ Date: now, Number: user.phoneNumber, Status: "Success" });
          sentCount++;
          notifications.push(`${user.username}: ${pick.text} (+${delta.toFixed(1)})`);
        } catch (err) {
          await textHistory.insertOne({ Date: now, Number: user.phoneNumber, Status: "Error" });
          console.error(`Failed to send odds alert to ${user.username}:`, err);
        }

        await picksCollection.updateOne(
          { _id: pick._id },
          { $set: { oddsAlertSent: true, oddsAlertSentAt: now } }
        );
      }
    }

    const detail = notifications.length ? `\n${notifications.join("\n")}` : "";
    const successMsg = `Odds Alert job: sent ${sentCount} alert(s).${detail}`;
    console.log(successMsg);
    await logCronRun("Odds Alert", "success", successMsg);
    return successMsg;
  } catch (error) {
    console.error("Error during odds alert job:", error);
    await logCronRun("Odds Alert", "error", error.message);
    throw error;
  } finally {
    await client.close();
  }
}
