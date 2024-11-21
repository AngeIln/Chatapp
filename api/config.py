# api/config.py
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.environ.get("MONGODB_URI")
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
CLOUD_NAME = os.environ.get("cloud_name")
API_KEY_CLOUD = os.environ.get("API_KEY_CLOUD")
API_SECRET_CLOUD = os.environ.get("API_SECRET_CLOUD")