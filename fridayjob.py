from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import theoddsapi

load_dotenv()
mongodb_uri = os.getenv('MONGODB_URI')
if not mongodb_uri:
    raise ValueError("MONGODB_URI not found in .env file")

client = MongoClient(mongodb_uri)
db = client['SlackGambling']
games_collection = db['Games']

def load_games():
    commence_time_from = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    commence_time_to = (commence_time_from + timedelta(days=6)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    games = theoddsapi.get_games(commence_time_from, commence_time_to)
    games_collection.insert_many(games)

try:
    load_games()
except Exception as error:
    print("Error Inserting Games: ", error)

client.close()

print("Friday Job Success")
