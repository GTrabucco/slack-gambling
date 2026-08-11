import axios from 'axios';

const SCOREBOARD_URL = 'https://cdn.espn.com/core/nfl/scoreboard';
const ODDS_URL = 'https://site.web.api.espn.com/apis/v3/sports/football/nfl/odds';

/**
 * Parse DraftKings odds out of an ESPN competition's odds array.
 * Returns { home_spread, away_spread, over, under } — any may be null.
 */
function extractDraftKingsOdds(competitionOdds = []) {
  for (const odd of competitionOdds) {
    if (odd.provider?.name !== 'DraftKings') continue;

    const ps = odd.pointSpread || {};
    const homeClose = ps.home?.close ?? ps.home?.open;
    const awayClose = ps.away?.close ?? ps.away?.open;

    const total = odd.total || {};
    const overLine = total.over?.close?.line ?? total.over?.open?.line ?? null;
    const underLine = total.under?.close?.line ?? total.under?.open?.line ?? null;
    const parseOULine = (line) => line !== null ? parseFloat(String(line).replace(/^[ou]/i, '')) || null : null;

    return {
      home_spread: homeClose?.line ?? null,
      away_spread: awayClose?.line ?? null,
      over: parseOULine(overLine),
      under: parseOULine(underLine),
    };
  }
  return { home_spread: null, away_spread: null, over: null, under: null };
}

/**
 * Build a map of ESPN competition ID → DraftKings odds
 * by walking the ESPN odds API response.
 */
function buildOddsMap(oddsData) {
  const map = {};
  for (const line of (oddsData.lines || [])) {
    for (const event of (line.events || [])) {
      for (const comp of (event.competitions || [])) {
        if (!comp.id) continue;
        map[comp.id] = extractDraftKingsOdds(comp.odds || []);
      }
    }
  }
  return map;
}

/**
 * Parse an ESPN scoreboard events array into game objects.
 */
function parseScoreboardEvents(events, oddsMap = {}) {
  const games = [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    let homeTeam = '', awayTeam = '', homeScore = null, awayScore = null;
    for (const c of (comp.competitors || [])) {
      if (c.homeAway === 'home') {
        homeTeam = c.team?.displayName ?? '';
        homeScore = c.score ?? null;
      } else {
        awayTeam = c.team?.displayName ?? '';
        awayScore = c.score ?? null;
      }
    }

    const status = comp.status || {};
    const odds = oddsMap[comp.id] || { home_spread: null, away_spread: null, over: null, under: null };

    games.push({
      gameId: comp.id,
      commence_time: comp.date || comp.startDate,
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScore,
      away_score: awayScore,
      home_spread: odds.home_spread,
      away_spread: odds.away_spread,
      over: odds.over,
      under: odds.under,
      status: status.type?.name || '',
      status_detail: status.type?.detail || '',
      status_short_detail: status.type?.shortDetail || '',
      period: status.period || 0,
      clock: status.displayClock || '',
      is_completed: status.type?.completed === true,
      state: status.type?.state || 'pre',
    });
  }
  return games;
}

/**
 * Fetch games for a specific NFL week with DraftKings odds.
 * season: e.g. 2026
 * weekType: 1=preseason, 2=regular, 3=postseason
 * week: week number
 */
export async function getGames(season, weekType, week) {
  try {
    const [scoreboardRes, oddsRes] = await Promise.all([
      axios.get(SCOREBOARD_URL, {
        params: { xhr: 1, limit: 50, season, seasontype: weekType, week },
      }),
      axios.get(ODDS_URL).catch(() => ({ data: { lines: [] } })),
    ]);

    const events = scoreboardRes.data?.content?.sbData?.events || [];
    if (events.length === 0) {
      console.warn(`getGames: no events found for season=${season} weekType=${weekType} week=${week}`);
    }

    const oddsMap = buildOddsMap(oddsRes.data);
    const games = parseScoreboardEvents(events, oddsMap);

    // Return only the fields the rest of the app expects
    return games.map(g => ({
      gameId: g.gameId,
      commence_time: g.commence_time,
      home_team: g.home_team,
      away_team: g.away_team,
      home_spread: g.home_spread,
      away_spread: g.away_spread,
      over: g.over,
      under: g.under,
    }));
  } catch (error) {
    console.error('getGames ESPN error:', error.message);
    return [];
  }
}

/**
 * Fetch the live scoreboard for the current NFL week.
 * Returns full game objects including live scores and status.
 */
export async function getLiveScoreboard() {
  const [scoreboardRes, oddsRes] = await Promise.all([
    axios.get(SCOREBOARD_URL, { params: { xhr: 1, limit: 50 } }),
    axios.get(ODDS_URL).catch(() => ({ data: { lines: [] } })),
  ]);

  const sbData = scoreboardRes.data?.content?.sbData || {};
  const events = sbData.events || [];
  const season = sbData.season || {};
  const week = sbData.week || {};

  const oddsMap = buildOddsMap(oddsRes.data);
  const games = parseScoreboardEvents(events, oddsMap);

  return {
    season: season.year,
    season_type: season.type,
    week: week.number,
    games,
  };
}

/**
 * Fetch game results for a specific week (used by processPicks).
 * Returns completed game objects: { gameId, homeTeam, awayTeam, homeScore, awayScore, completed }
 */
export async function getWeeklyResults(season, weekType, week) {
  try {
    const res = await axios.get(SCOREBOARD_URL, {
      params: { xhr: 1, limit: 50, season, seasontype: weekType, week },
    });

    const events = res.data?.content?.sbData?.events || [];
    const results = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      let homeTeam = '', awayTeam = '', homeScore = '', awayScore = '';
      for (const c of (comp.competitors || [])) {
        if (c.homeAway === 'home') {
          homeTeam = c.team?.displayName ?? '';
          homeScore = c.score ?? '';
        } else {
          awayTeam = c.team?.displayName ?? '';
          awayScore = c.score ?? '';
        }
      }

      results.push({
        gameId: comp.id,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        completed: comp.status?.type?.completed === true,
      });
    }

    return results;
  } catch (error) {
    console.error('getWeeklyResults ESPN error:', error.message);
    return [];
  }
}
