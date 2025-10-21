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
picks_history_collection = db["Picks_History"]

# Create backups directory if it doesn't exist
backup_dir = "backups"
os.makedirs(backup_dir, exist_ok=True)

def backup_picks():
    try:
        # Fetch all documents from Picks
        docs = list(picks_collection.find({}))
        ph_docs = list(picks_history_collection.find({}))
        # if not docs:
        #     print("No documents found in Picks collection.")
        #     return

        # Create a timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"picks_backup_{timestamp}.json")
        backup_file_2 = os.path.join(backup_dir, f"picks_history_backup_{timestamp}.json")
        # Save documents as JSON (using json_util to handle ObjectId, datetime, etc.)
        # with open(backup_file, "w", encoding="utf-8") as f:
        #     json.dump(docs, f, default=json_util.default, indent=2)

        print(f"Backup complete! Saved {len(docs)} documents to {backup_file}")

        with open(backup_file_2, "w", encoding="utf-8") as f:
            json.dump(ph_docs, f, default=json_util.default, indent=2)

        # print(f"Backup complete! Saved {len(ph_docs)} documents to {backup_file_2}")

    except Exception as e:
        print(f"Error during backup: {e}")

if __name__ == "__main__":
    backup_picks()
