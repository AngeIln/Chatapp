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

# Initialization of FastAPI app
app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:3000",  # Frontend development
    "https://your-frontend-domain.com",  # Replace with your frontend domain in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory for uploaded files
UPLOAD_DIRECTORY = "uploads"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")

# MongoDB Database connection
client = MongoClient(MONGODB_URI)
db = client["FIRSTSERv"]
users_collection = db["users"]
conversations_collection = db["conversations"]

# Create indexes if necessary
users_collection.create_index([("name", ASCENDING)], unique=True)
conversations_collection.create_index([("participants", ASCENDING)])
conversations_collection.create_index([("messages.content", TEXT)])

# Dictionary to store WebSocket connections per conversation
connections: Dict[str, Set[WebSocket]] = {}

# Model for updating bio
class BioUpdate(BaseModel):
    bio: str

# Signup endpoint
@app.post("/signup", response_model=User)
def signup(user: UserCreate):
    # Check if the user already exists
    if users_collection.find_one({"name": user.name}):
        raise HTTPException(status_code=400, detail="A user with that name already exists.")

    # Hash the password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    # Create the user
    user_doc = {
        "name": user.name,
        "password": hashed_password.decode('utf-8'),
        "bio": user.bio or "",  # Initialize bio
        "avatar_url": None
    }
    result = users_collection.insert_one(user_doc)
    return User(
        id=str(result.inserted_id),
        name=user.name,
        bio=user.bio or "",
        avatar_url=None
    )

# Login endpoint
@app.post("/login")
def login(form_data: UserCreate):
    user = authenticate_user(users_collection, form_data.name, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# Endpoint to get current user's profile
@app.get("/users/me", response_model=User)
def read_current_user(current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": current_user.name})
    return User(
        id=str(user["_id"]),
        name=user["name"],
        bio=user.get("bio", ""),
        avatar_url=user.get("avatar_url")
    )

# Endpoint to update current user's bio
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

# Endpoint to get a user's profile by username
@app.get("/users/{username}", response_model=UserBase)
def get_user_profile(username: str, current_user: UserInDB = Depends(get_current_user)):
    user = users_collection.find_one({"name": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserBase(
        name=user["name"],
        bio=user.get("bio", "")
    )

# Endpoint to get all users
@app.get("/users", response_model=List[UserBase])
def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    users = users_collection.find({})
    return [UserBase(name=user["name"], bio=user.get("bio", ""), avatar_url=user.get("avatar_url")) for user in users]

# Endpoint to create a conversation
@app.post("/conversations", response_model=Conversation)
def create_conversation(convo: ConversationCreate, current_user: UserInDB = Depends(get_current_user)):
    participants = convo.participants
    if current_user.name not in participants:
        participants.append(current_user.name)

    # Verify that users exist
    for name in participants:
        if not users_collection.find_one({"name": name}):
            raise HTTPException(status_code=404, detail=f"User {name} not found")

    # If it's a one-on-one conversation without a name, check if it exists
    if len(participants) == 2 and not convo.name:
        existing_convo = conversations_collection.find_one({
            "participants": {"$all": participants},
            "name": {"$exists": False}
        })
        if existing_convo:
            raise HTTPException(status_code=400, detail="Conversation already exists")

    # Create the conversation
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

# Endpoint to get conversations for current user
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

# Endpoint to get a conversation by ID
@app.get("/conversations/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    messages = [Message(**msg) for msg in conversation.get("messages", [])]
    return Conversation(
        id=str(conversation['_id']),
        name=conversation.get("name"),
        participants=conversation["participants"],
        messages=messages
    )

# Endpoint to send a message to a conversation via REST (optional)
@app.post("/conversations/{conversation_id}/messages", response_model=Message)
def send_message(conversation_id: str, message_create: MessageCreate, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create the message
    message = Message(
        sender=current_user.name,
        content=message_create.content or "",
        timestamp=datetime.utcnow(),
        media=message_create.media or "",
        reactions={}
    )
    # Save the message to the database
    message_doc = message.dict()
    message_doc["timestamp"] = message.timestamp  # Ensure timestamp is serializable

    conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": message_doc}}
    )

    return message
# Add the endpoint to get messages
@app.get("/conversations/{conversation_id}/messages", response_model=List[Message])
def get_messages(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    messages = [Message(**msg) for msg in conversation.get("messages", [])]
    return messages
# Endpoint to delete a conversation
@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: UserInDB = Depends(get_current_user)):
    conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.name not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")

    conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
    return {"detail": "Conversation deleted"}

# Endpoint to upload an avatar or other media
@app.post("/upload/avatar/", response_model=dict)
async def upload_avatar(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)):
    # Check file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    # Check file size (limited to 5MB)
    contents = await file.read()
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the limit of 5MB.")
    await file.seek(0)  # Reset file pointer after reading

    # Generate a unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{current_user.name}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Generate the file URL
    file_url = f"/uploads/{filename}"

    # Update the user's avatar_url
    users_collection.update_one(
        {"name": current_user.name},
        {"$set": {"avatar_url": file_url}}
    )
    return {"avatar_url": file_url}

# WebSocket endpoint for a conversation
@app.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Authenticate the token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user = get_user(users_collection, username)
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify that the user is a participant in the conversation
    try:
        conversation = conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    except:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not conversation:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    if user.name not in conversation["participants"]:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    if conversation_id not in connections:
        connections[conversation_id] = set()
    connections[conversation_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            event = message_data.get('event')

            if event == 'typing':
                # Broadcast typing event to other clients
                if conversation_id in connections:
                    for connection in connections[conversation_id]:
                        if connection != websocket:
                            await connection.send_json({'event': 'typing', 'data': {'user': user.name}})
            else:
                content = message_data.get("content")
                media = message_data.get("media")

                if not content and not media:
                    continue

                message = Message(
                    sender=user.name,
                    content=content or "",
                    timestamp=datetime.utcnow(),
                    media=media or "",
                    reactions={}
                )

                # Save the message to the database
                message_doc = message.dict()
                message_doc["timestamp"] = message.timestamp

                conversations_collection.update_one(
                    {"_id": ObjectId(conversation_id)},
                    {"$push": {"messages": message_doc}}
                )

                # Send the message to all connected clients
                if conversation_id in connections:
                    for connection in connections[conversation_id]:
                        await connection.send_json(message.dict())

    except WebSocketDisconnect:
        connections[conversation_id].remove(websocket)
        if not connections[conversation_id]:
            del connections[conversation_id]
    except Exception as e:
        print(f"WebSocket error: {e}")
        connections[conversation_id].remove(websocket)
        if not connections[conversation_id]:
            del connections[conversation_id]

# Include other necessary files (authentication.py, config.py, database.py, models.py) as before