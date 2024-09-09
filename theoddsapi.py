import requests
import pandas as pd
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()
mongodb_uri = os.getenv('MONGODB_URI')
if not mongodb_uri:
    raise ValueError('MONGODB_URI not found in .env file')

odds_api_key = os.getenv('ODDS_API_KEY')
if not odds_api_key:
    raise ValueError('ODDS_API_KEY not found in .env file')

SPORT = 'americanfootball_nfl'
REGIONS = 'us'
MARKETS = 'totals,spreads'
ODDS_FORMAT = 'american'
DATE_FORMAT = 'iso'

def format_games(data):
    to_return = []
    games = json.loads(data)
    for game in games:
        home_spread = away_spread = over = under = None
        for bookmaker in game['bookmakers']:
            for market in bookmaker['markets']:
                if market['key'] == 'spreads':
                    for outcome in market['outcomes']:
                        if outcome['name'] == game['home_team']:
                            home_spread = outcome['point']
                        elif outcome['name'] == game['away_team']:
                            away_spread = outcome['point']
                elif market['key'] == 'totals':
                    for outcome in market['outcomes']:
                        if outcome['name'] == 'Over':
                            over = outcome['point']
                        elif outcome['name'] == 'Under':
                            under = outcome['point']
        to_return.append({
            "gameId": game["id"],
            "commence_time": game['commence_time'],
            "home_team": game['home_team'],
            "away_team": game['away_team'],
            "home_spread": str(home_spread),
            "away_spread": str(away_spread),
            "over": str(over),
            "under": str(under)
        })

    return to_return

def get_games(startDate, endDate):
    formatted_from = startDate.strftime('%Y-%m-%dT%H:%M:%SZ')
    formatted_to = endDate.strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        odds_response = requests.get(
            f'https://api.the-odds-api.com/v4/sports/{SPORT}/odds',
            params={
                'api_key': odds_api_key,
                'regions': REGIONS,
                'markets': MARKETS,
                'oddsFormat': ODDS_FORMAT,
                'dateFormat': DATE_FORMAT,
                'commenceTimeFrom': formatted_from,
                'commenceTimeTo': formatted_to,
                'bookmakers': 'draftkings'
            },
        )

        formatted_games = format_games(odds_response.text)
        return formatted_games
    except Exception as error:
        print('Error is theoddsapi get function: ', error)