import datetime
from typing import List, Dict
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from database import db
from models import UserRegister, UserLogin, UserResponse, TokenResponse, MessageCreate, MessageResponse, ChatCreate
from auth_utils import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI(title="BMS Backend API", version="1.0.0")

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Real-Time Connection Manager
class ConnectionManager:
    def __init__(self):
        # Map user_id to active WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast_to_chat(self, message: dict, participant_ids: List[str]):
        for uid in participant_ids:
            if uid in self.active_connections:
                await self.active_connections[uid].send_json(message)

manager = ConnectionManager()

# Helper serializer
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ROOT ROUTE
@app.get("/")
async def root():
    return {"message": "BMS FastAPI Backend Server is running"}

# AUTHENTICATION ROUTES
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    users_col = db["users"]
    
    # Check if username or email exists
    existing_user = await users_col.find_one({
        "$or": [{"email": user_data.email}, {"username": user_data.username}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")

    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "status": "Available",
        "created_at": datetime.datetime.utcnow()
    }

    result = await users_col.insert_one(new_user)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "username": user_data.username})
    
    user_response = UserResponse(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        status="Available",
        created_at=new_user["created_at"]
    )

    return TokenResponse(access_token=token, user=user_response)


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = db["users"]
    user = await users_col.find_one({
        "$or": [{"email": credentials.identifier}, {"username": credentials.identifier}]
    })

    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "username": user["username"]})

    user_response = UserResponse(
        id=user_id,
        username=user["username"],
        email=user["email"],
        status=user.get("status", "Available"),
        created_at=user.get("created_at", datetime.datetime.utcnow())
    )

    return TokenResponse(access_token=token, user=user_response)


# CHAT & MESSAGES REST ROUTES
@app.post("/api/chats")
async def create_chat(chat_data: ChatCreate):
    chats_col = db["chats"]
    new_chat = {
        "chat_name": chat_data.chat_name,
        "is_group": chat_data.is_group,
        "participants": chat_data.participants,
        "created_at": datetime.datetime.utcnow()
    }
    result = await chats_col.insert_one(new_chat)
    new_chat["id"] = str(result.inserted_id)
    del new_chat["_id"]
    return new_chat


@app.get("/api/chats/{chat_id}/messages")
async def get_messages(chat_id: str):
    messages_col = db["messages"]
    cursor = messages_col.find({"chat_id": chat_id}).sort("timestamp", 1)
    messages = await cursor.to_list(length=200)
    return [serialize_doc(m) for m in messages]


# REAL-TIME WEBSOCKET ENDPOINT
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Message structure: { action: "send_message", chat_id: "...", receiver_id: "...", text: "...", msg_type: "text" }
            action = data.get("action")
            
            if action == "send_message":
                chat_id = data.get("chat_id")
                receiver_id = data.get("receiver_id")
                text = data.get("text")
                msg_type = data.get("msg_type", "text")
                media_url = data.get("media_url")
                file_name = data.get("file_name")

                msg_doc = {
                    "chat_id": chat_id,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "text": text,
                    "msg_type": msg_type,
                    "media_url": media_url,
                    "file_name": file_name,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "reaction": None
                }

                # Save message to MongoDB
                result = await db["messages"].insert_one(msg_doc)
                msg_doc["id"] = str(result.inserted_id)
                if "_id" in msg_doc:
                    del msg_doc["_id"]

                # Send real-time payload to sender and receiver
                await manager.send_personal_message(msg_doc, user_id)
                if receiver_id:
                    await manager.send_personal_message(msg_doc, receiver_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
