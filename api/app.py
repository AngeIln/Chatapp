from fastapi import FastAPI, Depends, HTTPException, status
from typing import List
from models import *
from authentication import *
from config import *
from database import *
from bson.objectid import ObjectId
import bcrypt
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()





# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, world!"}

@app.post("/signup", response_model=User)
def signup(user: UserCreate):
    # Vérifier si l'utilisateur existe déjà
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="Un utilisateur avec ce nom existe déjà.")
    
    # asher le mot de passe
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Créer l'utilisateur
    user_doc = {
        "name": user.name,
        "password": hashed_password.decode('utf-8')
    }
    result = users_collection.insert_one(user_doc)
    return User(id=str(result.inserted_id), name=user.name)

@app.post("/login")
def login(form_data: UserCreate):
    user = authenticate_user(users_collection, form_data.name, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur ou mot de passe incorrect")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ---- Gestion des conversations ----

@app.post("/conversations", response_model=Conversation)
def create_conversation(participants: List[str], current_user: UserInDB = Depends(get_current_user)):
    # Ajouter l'utilisateur courant aux participants s'il n'est pas déjà présent
    if current_user.name not in participants:
        participants.append(current_user.name)
    
    # Vérifier que les utilisateurs existent
    for name in participants:
        if not users_collection.find_one({"name": name}):
            raise HTTPException(status_code=404, detail=f"Utilisateur {name} introuvable")
    
    # Vérifier si la conversation existe déjà
    conversation = conversations_collection.find_one({"participants": {"$all": participants}})
    if conversation:
        raise HTTPException(status_code=400, detail="La conversation existe déjà")
    
    # Créer la conversation
    conversation_doc = {
        "participants": participants,
        "messages": []
    }
    result = conversations_collection.insert_one(conversation_doc)
    return Conversation(id=str(result.inserted_id), participants=participants)

@app.get("/conversations", response_model=List[Conversation])
def get_user_conversations(current_user: UserInDB = Depends(get_current_user)):
    conversations = conversations_collection.find({"participants": current_user.name})
    convo_list = []
    for convo in conversations:
        convo_list.append(Conversation(
            id=str(convo['_id']),
            participants=convo["participants"]
        ))
    return convo_list

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
        participants=conversation["participants"],
        messages=messages
    )

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

@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"detail": "Conversation supprimée"}

# ---- Gestion des utilisateurs connectés ----

@app.get("/users/me", response_model=UserBase)
def read_current_user(current_user: UserInDB = Depends(get_current_user)):
    return UserBase(name=current_user.name)

@app.get("/users", response_model=List[UserBase])
def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    users = users_collection.find({})
    return [UserBase(name=user["name"]) for user in users]
#
#if __name__ == "__main__":
#    import uvicorn
#    uvicorn.run(app, host="0.0.0.0", port=8000)
