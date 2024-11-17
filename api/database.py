# api/database.py
from pymongo import MongoClient, ASCENDING, TEXT
from config import MONGODB_URI

client = MongoClient(MONGODB_URI)
db = client["FIRSTSERv"]
users_collection = db["users"]
conversations_collection = db["conversations"]

# Créer des index si ils n'existent pas
users_collection.create_index([("name", ASCENDING)], unique=True)
conversations_collection.create_index([("participants", ASCENDING)])
conversations_collection.create_index([("messages.content", TEXT)])