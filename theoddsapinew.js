import axios from 'axios';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config();

const SPORT_NFL = 'americanfootball_nfl';
const SPORT_PRESEASON = 'americanfootball_nfl_preseason';
const REGIONS = 'us';
const MARKETS = 'totals,spreads';
const ODDS_FORMAT = 'american';
const DATE_FORMAT = 'iso';

const oddsApiKey = process.env.ODDS_API_KEY;

function formatGames(data) {
  const toReturn = [];
  const games = data;

  for (const game of games) {
    let home_spread = null, away_spread = null, over = null, under = null;

    for (const bookmaker of game.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        if (market.key === 'spreads') {
          for (const outcome of market.outcomes || []) {
            if (outcome.name === game.home_team) home_spread = outcome.point;
            else if (outcome.name === game.away_team) away_spread = outcome.point;
          }
        } else if (market.key === 'totals') {
          for (const outcome of market.outcomes || []) {
            if (outcome.name === 'Over') over = outcome.point;
            else if (outcome.name === 'Under') under = outcome.point;
          }
        }
      }
    }

    toReturn.push({
      gameId: game.id,
      commence_time: game.commence_time,
      home_team: game.home_team,
      away_team: game.away_team,
      home_spread: home_spread !== null ? home_spread.toString() : null,
      away_spread: away_spread !== null ? away_spread.toString() : null,
      over: over !== null ? over.toString() : null,
      under: under !== null ? under.toString() : null,
    });
  }

  return toReturn;
}

export async function getGames(startDate, endDate) {
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  let weekType = 2;
  try {
    await mongoClient.connect();
    const config = await mongoClient.db('SlackGambling').collection('Config').findOne({ _id: 'current' });
    weekType = config?.weekType ?? 2;
  } catch (e) {
    console.warn('getGames: could not read weekType from Config, defaulting to 2 (NFL regular season)');
  } finally {
    await mongoClient.close();
  }

  const sport = Number(weekType) === 1 ? SPORT_PRESEASON : SPORT_NFL;
  const formattedFrom = startDate.toISOString().split('.')[0] + 'Z';
  const formattedTo = endDate.toISOString().split('.')[0] + 'Z';

  const cacheClient = new MongoClient(process.env.MONGODB_URI);
  try {
    const response = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds`,
      {
        params: {
          api_key: oddsApiKey,
          regions: REGIONS,
          markets: MARKETS,
          oddsFormat: ODDS_FORMAT,
          dateFormat: DATE_FORMAT,
          commenceTimeFrom: formattedFrom,
          commenceTimeTo: formattedTo,
          bookmakers: 'draftkings',
        },
      }
    );

    const formattedGames = formatGames(response.data);

    // Cache the successful response
    try {
      await cacheClient.connect();
      await cacheClient.db('SlackGambling').collection('Games_Cache').updateOne(
        { _id: 'latest' },
        { $set: { games: formattedGames, cachedAt: new Date() } },
        { upsert: true }
      );
    } catch (cacheErr) {
      console.warn('Failed to cache odds response:', cacheErr.message);
    } finally {
      await cacheClient.close();
    }

    return formattedGames;
  } catch (error) {
    console.error('Error in theoddsapi getGames — attempting cache fallback:', error.message);

    // Fallback to cached response
    try {
      await cacheClient.connect();
      const cached = await cacheClient.db('SlackGambling').collection('Games_Cache').findOne({ _id: 'latest' });
      if (cached?.games) {
        console.warn(`Using cached odds from ${cached.cachedAt}`);
        return cached.games;
      }
    } catch (cacheErr) {
      console.error('Cache fallback also failed:', cacheErr.message);
    } finally {
      await cacheClient.close();
    }

    return [];
  }
}