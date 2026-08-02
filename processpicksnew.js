import axios from "axios";

const BASE_BOXSCORE_URL = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons';
const BASE_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';

function isValidInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function validateInputs(season, week, weekType) {
  if (!isValidInteger(season) || !isValidInteger(week) || ![1, 2, 3].includes(Number(weekType))) {
    throw new Error("Invalid input parameters for ESPN API call.");
  }
}

function buildBoxscoresUrl(season, week, weekType) {
  const url = new URL(`${BASE_BOXSCORE_URL}/${season}/types/${weekType}/weeks/${week}/events`);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('region', 'us');
  return url.toString();
}

function extractEventIds(items = []) {
  return items.map(item => {
    const ref = item['$ref'];
    return ref.split('/').pop().split('?')[0];
  });
}

async function fetchGameResults(eventIds) {
  const results = [];

  for (const id of eventIds) {
    const response = await axios.get(`${BASE_SUMMARY_URL}?event=${id}`);
    const competitors = response.data?.header?.competitions?.[0]?.competitors || [];

    const game = {
      homeTeam: '',
      awayTeam: '',
      homeScore: '',
      awayScore: ''
    };

    for (const team of competitors) {
      if (team.homeAway === 'home') {
        game.homeTeam = team.team.displayName;
        game.homeScore = team.score;
      } else {
        game.awayTeam = team.team.displayName;
        game.awayScore = team.score;
      }
    }

    results.push(game);
  }

  return results;
}

function calculatePickResult(pick, result) {
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

export async function processPicks(season, week, picks, weekType) {
  try {
    validateInputs(season, week, weekType);

    const boxscoresUrl = buildBoxscoresUrl(season, week, weekType);
    const boxscoresResponse = await axios.get(boxscoresUrl);

    if (boxscoresResponse.status !== 200) {
      throw new Error(`Failed to retrieve data: ${boxscoresResponse.status}`);
    }

    const eventIds = extractEventIds(boxscoresResponse.data.items);
    const gameResults = await fetchGameResults(eventIds);
    
    for (const pick of picks) {
      if (pick.result !== undefined) continue; 
      const result = gameResults.find(
        res => res.homeTeam === pick.homeTeam && res.awayTeam === pick.awayTeam
      );

      if (!result) {
        throw new Error(`Game result not found for pick: ${JSON.stringify(pick)}`);
      }

      pick.result = calculatePickResult(pick, result);
    }

    return picks;
  } catch (error) {
    console.error('Error in processPicks:', error);
    throw error;
  }
}
