# api/app.py

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Set, List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
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
from config import MONGODB_URI, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Initialisation de l'application FastAPI
app = FastAPI()

# Configuration CORS
origins = [
    "http://localhost:3000",  # Frontend en développement
    "https://your-frontend-domain.com",  # Remplacez par le domaine de votre frontend en production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Liste des origines autorisées
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossier pour les fichiers téléchargés
UPLOAD_DIRECTORY = "uploads"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")

# Connexion à la base de données MongoDB
client = MongoClient(MONGODB_URI)
db = client["FIRSTSERv"]
users_collection = db["users"]
conversations_collection = db["conversations"]

# Création des index si nécessaire
users_collection.create_index([("name", ASCENDING)], unique=True)
conversations_collection.create_index([("participants", ASCENDING)])
conversations_collection.create_index([("messages.content", TEXT)])

# Dictionnaire pour stocker les connexions WebSocket par conversation
connections: Dict[str, Set[WebSocket]] = {}

# Modèle pour la mise à jour de la bio
class BioUpdate(BaseModel):
    bio: str

# Endpoint pour l'inscription
@app.post("/signup", response_model=User)
def signup(user: UserCreate):
    # Vérifier si l'utilisateur existe déjà
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="Un utilisateur avec ce nom existe déjà.")

    # Hasher le mot de passe
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    # Créer l'utilisateur
    user_doc = {
        "name": user.name,
        "password": hashed_password.decode('utf-8'),
        "bio": user.bio or "",  # Initialiser la bio
        "avatar_url": None
    }
    result = users_collection.insert_one(user_doc)
    return User(
        id=str(result.inserted_id),
        name=user.name,
        bio=user.bio or "",
        avatar_url=None
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

# Endpoint pour envoyer un message à une conversation via REST
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
    
    # Créer le message
    message = Message(
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

# Endpoint pour obtenir les messages d'une conversation
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

# Endpoint pour supprimer une conversation
@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"detail": "Conversation supprimée"}

# Endpoint pour télécharger un avatar ou autre média
@app.post("/upload/avatar/", response_model=dict)
async def upload_avatar(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)):
    # Vérifier le type de fichier
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers image sont autorisés.")

    # Vérifier la taille du fichier (limité à 5MB)
    contents = await file.read()
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="La taille du fichier dépasse la limite de 5MB.")
    await file.seek(0)  # Réinitialiser le pointeur de fichier après la lecture

    # Générer un nom de fichier unique
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{current_user.name}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)

    # Enregistrer le fichier
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Générer l'URL du fichier
    # Remplacez 'http://localhost:8000' par votre domaine ou adresse IP et port corrects
    file_url = f"http://localhost:8000/uploads/{filename}"

    # Mettre à jour l'avatar_url de l'utilisateur
    users_collection.update_one(
        {"name": current_user.name},
        {"$set": {"avatar_url": file_url}}
    )
    return {"avatar_url": file_url}

# Autres endpoints et WebSocket (non modifiés dans ce contexte)... 

# N'oubliez pas d'inclure également les autres fichiers nécessaires (authentication.py, config.py, database.py, models.py)