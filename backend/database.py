import os
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = "slm_compliance_db"

# Create custom SSL context for Python 3.13 compatibility
try:
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
    
    client = AsyncIOMotorClient(MONGODB_URI, ssl_context=ssl_context)
except Exception as e:
    print(f"WARNING: SSL context creation failed: {e}")
    print("WARNING: Falling back to basic connection...")
    client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

async def check_db_connection():
    try:
        # The ping command is cheap and does not require auth.
        await client.admin.command('ping')
        print("SUCCESS: Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"ERROR: Could not connect to MongoDB: {e}")

# Collections
users_collection = db["users"]
documents_collection = db["documents"]
audit_logs_collection = db["audit_logs"]
