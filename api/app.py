from fastapi import FastAPI, Depends, HTTPException, status
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from models import *
from authentication import *
from config import *
from database import *
from bson.objectid import ObjectId
import bcrypt
from pydantic import BaseModel
from datetime import timedelta

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust based on your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèle pour la mise à jour de la bio
class BioUpdate(BaseModel):
    bio: str

# Inscription d'un nouvel utilisateur
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
        "bio": user.bio or ""  # Initialiser la bio
    }
    result = users_collection.insert_one(user_doc)
    return User(
        id=str(result.inserted_id),
        name=user.name,
        bio=user.bio or ""
    )

# Connexion d'un utilisateur (Endpoint token mis à jour)
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

# ---- Gestion des bios ----

# Récupérer le profil de l'utilisateur courant
@app.get("/users/me", response_model=User)
def read_current_user(current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": current_user.name})
    return User(
        id=str(user["_id"]),
        name=user["name"],
        bio=user.get("bio", "")
    )

# Mettre à jour la bio de l'utilisateur courant
@app.put("/users/me/bio", response_model=UserBase)
def update_bio(bio_update: BioUpdate, current_user: UserInDB = Depends(get_current_user)):
    users_collection.update_one(
        {"name": current_user.name},
        {"$set": {"bio": bio_update.bio}}
    )
    updated_user = users_collection.find_one({"name": current_user.name})
    return UserBase(
        name=updated_user["name"],
        bio=updated_user.get("bio", "")
    )

# Récupérer le profil d'un utilisateur par nom
@app.get("/users/{username}", response_model=UserBase)
def get_user_profile(username: str, current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return UserBase(
        name=user["name"],
        bio=user.get("bio", "")
    )

# Récupérer tous les utilisateurs
@app.get("/users", response_model=List[UserBase])
def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    users = users_collection.find({})
    return [UserBase(name=user["name"], bio=user.get("bio", "")) for user in users]

# ---- Gestion des conversations ----

# Modèle pour la création d'une conversation
class ConversationCreate(BaseModel):
    participants: List[str]
    name: Optional[str] = None

@app.post("/conversations", response_model=Conversation)
def create_conversation(convo: ConversationCreate, current_user: UserInDB = Depends(get_current_user)):
    participants = convo.participants
    if current_user.name not in participants:
        participants.append(current_user.name)

    # Vérifier que les utilisateurs existent
    for name in participants:
        if not users_collection.find_one({"name": name}):
            raise HTTPException(status_code=404, detail=f"Utilisateur {name} introuvable")

    # Si c'est une conversation individuelle sans nom, vérifier si elle existe déjà
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

# Récupérer les conversations de l'utilisateur courant
@app.get("/conversations", response_model=List[Conversation])
def get_user_conversations(current_user: UserInDB = Depends(get_current_user)):
    conversations = conversations_collection.find({"participants": current_user.name})
    convo_list = []
    for convo in conversations:
        convo_list.append(Conversation(
            id=str(convo['_id']),
            name=convo.get("name"),
            participants=convo["participants"]
        ))
    return convo_list

# Récupérer une conversation par son ID
@app.get("/conversations/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
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

# Envoyer un message dans une conversation
@app.post("/conversations/{conversation_id}/messages", response_model=Message)
def send_message(conversation_id: str, message: Message, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    message_doc = message.dict()
    message_doc["timestamp"] = message.timestamp

    conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": message_doc}}
    )
    return message

# Supprimer une conversation
@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"detail": "Conversation supprimée"}