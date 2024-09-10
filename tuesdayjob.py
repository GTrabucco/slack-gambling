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
picks_collection = db['Picks']
picks_history_collection = db['Picks_History']
games_collection = db['Games']
games_history_collection = db['Games_History']

def copy_and_clear_collection(source_collection, target_collection):
    documents = list(source_collection.find({}))
    if target_collection.name == 'Picks_History':
        for doc in documents:
            doc['result'] = 0
    if documents:
        target_collection.insert_many(documents)
        source_collection.delete_many({})

def load_games():
    commence_time_from = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    commence_time_to = (commence_time_from + timedelta(days=4)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    games = theoddsapi.get_games(commence_time_from, commence_time_to)
    games_collection.insert_many(games)

try:
    copy_and_clear_collection(picks_collection, picks_history_collection)
except Exception as error:
    print("Error copying Picks into Picks_History and clearing Picks: ", error)

try:
    copy_and_clear_collection(games_collection, games_history_collection)
except Exception as error:
    print("Error copying Games into Games_History and clearing Games: ", error)

try:
    load_games()
except Exception as error:
    print("Error Inserting Games: ", error)

client.close()

print("Tuesday Job Success")
