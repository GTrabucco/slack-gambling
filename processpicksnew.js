const axios = require('axios');

async function processPicks(season, week, picks, weekType) {
  // weekType: 1 is preseason, 2 is regular season, 3 is playoffs

  const boxscoresUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/${weekType}/weeks/${week}/events?lang=en&region=us`;
  const gameSummaryUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=`;

  try {
    // Get event IDs
    const boxscoresResponse = await axios.get(boxscoresUrl);
    if (boxscoresResponse.status !== 200) {
      throw new Error(`Failed to retrieve data: ${boxscoresResponse.status}`);
    }
    const items = boxscoresResponse.data.items || [];
    const eventIds = items.map(item => {
      const ref = item['$ref'];
      return ref.split('/').pop().split('?')[0];
    });

    // Get game results
    const results = [];
    for (const id of eventIds) {
      const summaryResponse = await axios.get(gameSummaryUrl + id);
      const teams = summaryResponse.data.header.competitions[0].competitors || [];

      const data = {
        homeTeam: '',
        awayTeam: '',
        homeScore: '',
        awayScore: '',
      };

      for (const team of teams) {
        if (team.homeAway === 'home') {
          data.homeTeam = team.team.displayName;
          data.homeScore = team.score;
        } else {
          data.awayTeam = team.team.displayName;
          data.awayScore = team.score;
        }
      }

      results.push(data);
    }

    // Match picks with results and calculate outcomes
    for (const pick of picks) {
      const result = results.find(
        res => res.homeTeam === pick.homeTeam && res.awayTeam === pick.awayTeam
      );

      if (!result) {
        throw new Error(`Error Processing Pick: ${JSON.stringify(pick)}`);
      }

      const homeScore = parseFloat(result.homeScore);
      const awayScore = parseFloat(result.awayScore);
      const value = parseFloat(pick.value);

      if (isNaN(homeScore) || isNaN(awayScore) || isNaN(value)) {
        throw new Error(`Error converting scores/values for pick: ${JSON.stringify(pick)}`);
      }

      if (pick.type === 'favorite' || pick.type === 'dog') {
        const pickedTeam = pick.text.split(' ').slice(0, -1).join(' ');
        if (pickedTeam === result.homeTeam) {
          const outcome = homeScore + value - awayScore;
          pick.result = outcome > 0 ? 1 : outcome < 0 ? -1 : 0;
        } else if (pickedTeam === result.awayTeam) {
          const outcome = awayScore + value - homeScore;
          pick.result = outcome > 0 ? 1 : outcome < 0 ? -1 : 0;
        } else {
          throw new Error(`Error Processing Pick (team mismatch): ${JSON.stringify(pick)}`);
        }
      } else if (pick.type === 'over') {
        const outcome = homeScore + awayScore - value;
        pick.result = outcome > 0 ? 1 : outcome < 0 ? -1 : 0;
      } else if (pick.type === 'under') {
        const outcome = homeScore + awayScore - value;
        pick.result = outcome > 0 ? -1 : outcome < 0 ? 1 : 0;
      } else {
        throw new Error(`Unknown pick type: ${pick.type}`);
      }
    }

    return picks;
  } catch (error) {
    console.error('Error in processPicks:', error);
    throw error;
  }
}

module.exports = { processPicks };
