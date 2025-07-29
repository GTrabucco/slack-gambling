from bson import ObjectId
from pymongo import MongoClient, errors, UpdateOne
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import theoddsapi
from processpicks import process_picks
from itertools import groupby
import pandas as pd
import sys

load_dotenv()
mongodb_uri = os.getenv('MONGODB_URI')
if not mongodb_uri:
    raise ValueError("MONGODB_URI not found in .env file")

SEASON = 2025
WEEK = 1
client = MongoClient(mongodb_uri)
db = client['SlackGambling']
picks_collection = db['Picks']
picks_history_collection = db['Picks_History']
games_collection = db['Games']
games_history_collection = db['Games_History']

def add_info_to_picks(session):
    picks_collection.update_many({}, {"$set": {"season": SEASON}}, session=session)
    picks_collection.update_many({}, {"$set": {"week": WEEK}}, session=session)

def copy_and_clear_collection(source_collection, target_collection, session):
    documents = list(source_collection.find({}))
    if documents:
        target_collection.insert_many(documents, session=session)
        source_collection.delete_many({}, session=session)

def load_games(session):
    commence_time_from = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    commence_time_to = (commence_time_from + timedelta(days=39)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    games = theoddsapi.get_games(commence_time_from, commence_time_to)
    for game in games:
        game["season"] = SEASON
        game["week"] = WEEK
    games_collection.insert_many(games, session=session)

def backup_data(session):
    f = open(f"backup/{SEASON}/{WEEK}.txt", "x")
    data = str(list(picks_collection.find({}, {"_id": 0})))
    print(data)
    print()
    data = data.replace("'", "\"")
    print(data)
    f.write(data)
    f.close()


try:
    with client.start_session() as session:
        with session.start_transaction():
            #backup_data(session)
            #processed_picks = process_picks(SEASON, WEEK, list(picks_collection.find()))
            #picks_history_collection.insert_many(processed_picks, session=session)
            #picks_collection.delete_many({}, session=session)
            #copy_and_clear_collection(games_collection, games_history_collection, session)
            load_games(session)
            #picks_history_collection.delete_many({}, session=session)
            print("tuesdayjob", SEASON, WEEK)

except errors.PyMongoError as error:
    print("Error during transaction: ", error)
finally:
    client.close()

print("Tuesday Job Success")



