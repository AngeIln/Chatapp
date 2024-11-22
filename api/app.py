import os
import json
from datetime import datetime, timedelta
from typing import Dict, Set, List, Optional
import random
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pymongo import MongoClient, ASCENDING, TEXT
from bson.objectid import ObjectId
import bcrypt
import jwt
from jwt.exceptions import PyJWTError as JWTError
from models import *
from authentication import get_current_user, authenticate_user, create_access_token, get_user
from config import MONGODB_URI, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, CLOUD_NAME, API_KEY_CLOUD, API_SECRET_CLOUD
import cloudinary
import cloudinary.api
import cloudinary.uploader
from uuid import uuid4
from dotenv import load_dotenv
import logging

# Charger les variables d'environnement à partir du fichier .env
load_dotenv()

# Configuration de Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUD_NAME'),
    api_key=os.getenv('API_KEY_CLOUD'),
    api_secret=os.getenv('API_SECRET_CLOUD'),
    secure=True,
)

app = FastAPI()

# Configuration CORS
origins = [
    "http://localhost:3000",  # Frontend en développement
    "https://frontend-lut9.onrender.com",  # Remplacez par le domaine de votre frontend en production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Liste des origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connexion à la base de données MongoDB
client = MongoClient(MONGODB_URI)
db = client["FIRSTSERv"]
users_collection = db["users"]
conversations_collection = db["conversations"]

users_collection.create_index([("name", ASCENDING)], unique=True)
conversations_collection.create_index([("participants", ASCENDING)])
conversations_collection.create_index([("messages.content", TEXT)])
connections: Dict[str, Set[WebSocket]] = {}

class BioUpdate(BaseModel):
    bio: str

@app.post("/signup", response_model=User)
def signup(user: UserCreate):
    # Vérifier si l'utilisateur existe déjà
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="Un utilisateur avec ce nom existe déjà.")

    # Hasher le mot de passe
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    random_pp = [
        "https://res.cloudinary.com/dcigc9jyw/raw/upload/v1732209655/avatar/e8kenkyye3vxpleuntso.jpg",
        "https://res.cloudinary.com/dcigc9jyw/raw/upload/v1732209837/avatar/ehgaeiwnr9eslhinl8x9.jpg",
        "https://res.cloudinary.com/dcigc9jyw/raw/upload/v1732210048/avatar/vfx6y1r9dngczafln2st.jpg"
    ]
    random_number = random.randint(0, len(random_pp) - 1)
    user_doc = {
        "name": user.name,
        "password": hashed_password.decode('utf-8'),
        "bio": user.bio or "",
        "avatar_url": random_pp[random_number]
    }
    result = users_collection.insert_one(user_doc)
    return User(
        id=str(result.inserted_id),
        name=user.name,
        bio=user.bio or "",
        avatar_url=random_pp[random_number]  # Correction ici pour inclure l'avatar_url
    )

# Endpoint pour la connexion
@app.post("/login")
def login(form_data: UserCreate):
    user = authenticate_user(users_collection, form_data.name, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur ou mot de passe incorrect")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# Endpoint pour obtenir le profil de l'utilisateur courant
@app.get("/users/me", response_model=User)
def read_current_user(current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": current_user.name})
    return User(
        id=str(user["_id"]),
        name=user["name"],
        bio=user.get("bio", ""),
        avatar_url=user.get("avatar_url")
    )

# Endpoint pour mettre à jour la bio de l'utilisateur courant
@app.put("/users/me/bio", response_model=UserBase)
def update_bio(bio_update: BioUpdate, current_user: UserInDB = Depends(get_current_user)):
    users_collection.update_one(
        {"name": current_user.name},
        {"$set": {"bio": bio_update.bio}}
    )
    updated_user = users_collection.find_one({"name": current_user.name})
    return UserBase(
        name=updated_user["name"],
        bio=updated_user.get("bio", ""),
        avatar_url=updated_user.get("avatar_url")
    )

# Endpoint pour obtenir le profil d'un utilisateur par nom d'utilisateur
@app.get("/users/{username}", response_model=UserBase)
def get_user_profile(username: str, current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return UserBase(
        name=user["name"],
        bio=user.get("bio", ""),
        avatar_url=user.get("avatar_url")  # Inclure avatar_url
    )

# Endpoint pour obtenir tous les utilisateurs
@app.get("/users", response_model=List[UserBase])
def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    users = users_collection.find({})
    return [UserBase(name=user["name"], bio=user.get("bio", ""), avatar_url=user.get("avatar_url")) for user in users]

# Endpoint pour créer une conversation
@app.post("/conversations", response_model=Conversation)
def create_conversation(convo: ConversationCreate, current_user: UserInDB = Depends(get_current_user)):
    participants = convo.participants
    if current_user.name not in participants:
        participants.append(current_user.name)

    # Vérifier que les utilisateurs existent
    for name in participants:
        if not users_collection.find_one({"name": name}):
            raise HTTPException(status_code=404, detail=f"Utilisateur {name} non trouvé")

    # Si c'est une conversation privée sans nom, vérifier si elle existe déjà
    if len(participants) == 2 and not convo.name:
        existing_convo = conversations_collection.find_one({
            "participants": {"$all": participants},
            "name": {"$exists": False}
        })
        if existing_convo:
            raise HTTPException(status_code=400, detail="La conversation existe déjà")

    # Créer la conversation
    conversation_doc = {
        "participants": participants,
        "messages": [],
    }
    if convo.name:
        conversation_doc["name"] = convo.name

    result = conversations_collection.insert_one(conversation_doc)
    return Conversation(
        id=str(result.inserted_id),
        name=convo.name,
        participants=participants
    )

# Endpoint pour obtenir les conversations de l'utilisateur courant
@app.get("/conversations", response_model=List[Conversation])
def get_user_conversations(current_user: UserInDB = Depends(get_current_user)):
    conversations = conversations_collection.find({"participants": current_user.name})
    convo_list = []
    for convo in conversations:
        convo_list.append(Conversation(
            id=str(convo['_id']),
            name=convo.get("name"),
            participants=convo["participants"],
            messages=[]
        ))
    return convo_list

# Endpoint pour obtenir une conversation par ID
@app.get("/conversations/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de conversation invalide")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    messages = [Message(**msg) for msg in conversation.get("messages", [])]
    return Conversation(
        id=str(conversation['_id']),
        name=conversation.get("name"),
        participants=conversation["participants"],
        messages=messages
    )

@app.post("/conversations/{conversation_id}/messages", response_model=Message)
def send_message(conversation_id: str, message_create: MessageCreate, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID de conversation invalide")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Créer le message avec un ID unique
    message = Message(
        id=str(uuid4()),  # Générer un ID unique pour le message
        sender=current_user.name,
        content=message_create.content or "",
        timestamp=datetime.utcnow(),
        media=message_create.media or "",
        reactions={}
    )
    # Enregistrer le message dans la base de données
    message_doc = message.dict()
    message_doc["timestamp"] = message.timestamp  # S'assurer que timestamp est sérialisable

    conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": message_doc}}
    )

    return message

@app.post("/conversations/{conversation_id}/messages/{message_id}/reactions", response_model=Message)
def add_reaction(conversation_id: str, message_id: str, reaction: str = Body(...), current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID de conversation invalide")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Trouver le message avec l'ID spécifié
    message = next((msg for msg in conversation["messages"] if str(msg["id"]) == message_id), None)
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")

    # Ajouter la réaction
    if reaction in message["reactions"]:
        message["reactions"][reaction] += 1
    else:
        message["reactions"][reaction] = 1

    # Mettre à jour la conversation dans la base de données
    conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"messages": conversation["messages"]}}
    )

    return message

@app.get("/conversations/{conversation_id}/messages", response_model=List[Message])
def get_messages(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID de conversation invalide")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    messages = [Message(**msg) for msg in conversation.get("messages", [])]
    return messages

@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"detail": "Conversation supprimée"}

@app.post("/upload/avatar/", response_model=dict)
async def upload_avatar(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers image sont autorisés.")

    # Vérifier la taille du fichier (limitée à 5MB)
    contents = await file.read()
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="La taille du fichier dépasse la limite de 5MB.")
    await file.seek(0)  # Réinitialiser le pointeur de fichier après la lecture

    # Enregistrer le fichier
    result = cloudinary.uploader.upload(file.file, folder="avatar", resource_type="raw")
    file_url = result["secure_url"]

    users_collection.update_one(
        {"name": current_user.name},
        {"$set": {"avatar_url": file_url}}
    )
    return {"avatar_url": file_url}
