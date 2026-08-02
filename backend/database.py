import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "BMS")

client_kwargs = {}
if "mongodb+srv://" in MONGODB_URL:
    client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
db = client[DATABASE_NAME]

def get_database():
    return db
