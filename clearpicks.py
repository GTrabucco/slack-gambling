from bson import json_util
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()
mongodb_uri = os.getenv("MONGODB_URI")
if not mongodb_uri:
    raise ValueError("MONGODB_URI not found in .env file")

# MongoDB setup
client = MongoClient(mongodb_uri)
db = client["SlackGambling"]
picks_collection = db["Picks"]

def clear_picks():
    try:
        picks_collection.delete_many({})
    except Exception as e:
        print(f"Error during backup: {e}")

if __name__ == "__main__":
    clear_picks()
