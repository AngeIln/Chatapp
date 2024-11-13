# database.py
from pymongo import MongoClient
from config import MONGODB_URI

client = MongoClient(MONGODB_URI)
db = client["FIRSTSERv"]
users_collection = db["users"]
conversations_collection = db["conversations"]