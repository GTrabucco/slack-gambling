import { getWeeklyResults } from './espnapi.js';

function isValidInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function validateInputs(season, week, weekType) {
  if (!isValidInteger(season) || !isValidInteger(week) || ![1, 2, 3].includes(Number(weekType))) {
    throw new Error("Invalid input parameters for ESPN API call.");
  }
}

export async function fetchGameResults(season, week, weekType) {
  return getWeeklyResults(season, weekType, week);
}

export function calculatePickResult(pick, result) {
  const homeScore = parseFloat(result.homeScore);
  const awayScore = parseFloat(result.awayScore);
  const value = parseFloat(pick.value);

  if ([homeScore, awayScore, value].some(isNaN)) {
    throw new Error(`Error converting scores/values for pick: ${JSON.stringify(pick)}`);
  }

  switch (pick.type) {
    case 'favorite':
    case 'dog': {
      const pickedTeam = pick.text.split(' ').slice(0, -1).join(' ');
      if (pickedTeam === result.homeTeam) {
        return homeScore + value - awayScore > 0 ? 1 : homeScore + value - awayScore < 0 ? -1 : 0;
      } else if (pickedTeam === result.awayTeam) {
        return awayScore + value - homeScore > 0 ? 1 : awayScore + value - homeScore < 0 ? -1 : 0;
      } else {
        throw new Error(`Team mismatch in pick: ${JSON.stringify(pick)}`);
      }
    }

    case 'gotw': {
      if (pick.text.includes('Over')) {
        return homeScore + awayScore - value > 0 ? 1 : homeScore + awayScore - value < 0 ? -1 : 0;
      } else if (pick.text.includes('Under')) {
        return homeScore + awayScore - value > 0 ? -1 : homeScore + awayScore - value < 0 ? 1 : 0;
      } else {
        const pickedTeam = pick.text.split(' ').slice(0, -1).join(' ');
        if (pickedTeam === result.homeTeam) {
          return homeScore + value - awayScore > 0 ? 1 : homeScore + value - awayScore < 0 ? -1 : 0;
        } else if (pickedTeam === result.awayTeam) {
          return awayScore + value - homeScore > 0 ? 1 : awayScore + value - homeScore < 0 ? -1 : 0;
        } else {
          throw new Error(`Team mismatch in pick: ${JSON.stringify(pick)}`);
        }
      }
    }

    case 'over':
      return homeScore + awayScore - value > 0 ? 1 : homeScore + awayScore - value < 0 ? -1 : 0;

    case 'under':
      return homeScore + awayScore - value > 0 ? -1 : homeScore + awayScore - value < 0 ? 1 : 0;

    default:
      throw new Error(`Unknown pick type: ${pick.type}`);
  }
}

export async function processPicks(season, week, weekType, picks) {
  try {
    validateInputs(season, week, weekType);

    const gameResults = await fetchGameResults(season, week, weekType);

    for (const pick of picks) {
      if (pick.result !== undefined) continue;

      // Match by gameId first (ESPN competition ID), then fall back to team names
      const result = gameResults.find(res =>
        (pick.gameId && res.gameId && String(pick.gameId) === String(res.gameId)) ||
        (res.homeTeam === pick.homeTeam && res.awayTeam === pick.awayTeam)
      );

      if (!result) {
        throw new Error(`Game result not found for pick: ${JSON.stringify(pick)}`);
      }

      if (!result.completed) continue;

      pick.result = calculatePickResult(pick, result);
    }

    return picks;
  } catch (error) {
    console.error('Error in processPicks:', error);
    throw error;
  }
}
