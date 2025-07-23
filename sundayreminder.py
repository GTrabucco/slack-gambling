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
from twilio.rest import Client
from datetime import datetime

load_dotenv()
mongodb_uri = os.getenv('MONGODB_URI')
if not mongodb_uri:
    raise ValueError("MONGODB_URI not found in .env file")

client = MongoClient(mongodb_uri)
db = client['SlackGambling']
users = db['User_Details']
text_history = db['Text_History']

account_sid = os.getenv('TWILIO_ACCOUNT_SID') 
auth_token = os.getenv('TWILIO_AUTH_TOKEN') 
client = Client(account_sid, auth_token)

reminder_users = users.find(
    {"receiveSundayReminder": True},
    {"phoneNumber": 1, "_id": 0}
)

numbers = [user["phoneNumber"] for user in reminder_users if "phoneNumber" in user]
for number in numbers:
    try:
        message = client.messages.create(
            from_="+18334966404",
            body=f"Reminder to make your picks. Visit https://www.SlackGambling.com to view/make your picks",
            to=number,
        )
        text_history.insert_one({"Date": str(datetime.now()), "Number": number, "Status": "Success"})
    except:
        text_history.insert_one({"Date": str(datetime.now()), "Number": number, "Status": "Error"})
