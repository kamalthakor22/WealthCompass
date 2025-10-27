from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from bs4 import BeautifulSoup
import re
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, str]

# Other Models
class BankAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    account_number: str
    currency: str
    balance: float
    country: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BankAccountCreate(BaseModel):
    name: str
    account_number: str
    currency: str
    balance: float
    country: str

class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    name: str
    quantity: float
    purchase_price: float
    purchase_date: str
    currency: str
    country: str
    exchange: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockCreate(BaseModel):
    symbol: str
    name: str
    quantity: float
    purchase_price: float
    purchase_date: str
    currency: str
    country: str
    exchange: str

class MutualFund(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    name: str
    units: float
    purchase_nav: float
    purchase_date: str
    currency: str
    country: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MutualFundCreate(BaseModel):
    symbol: str
    name: str
    units: float
    purchase_nav: float
    purchase_date: str
    currency: str
    country: str

class FixedDeposit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bank_name: str
    amount: float
    currency: str
    interest_rate: float
    start_date: str
    maturity_date: str
    country: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FixedDepositCreate(BaseModel):
    bank_name: str
    amount: float
    currency: str
    interest_rate: float
    start_date: str
    maturity_date: str
    country: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    description: str
    amount: float
    currency: str
    date: str
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    type: str
    description: str
    amount: float
    currency: str
    date: str
    category: str

# Auth Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Helper function to fetch price from Google Finance
async def fetch_google_finance_price(symbol: str) -> Optional[float]:
    try:
        url = f"https://www.google.com/finance/quote/{symbol}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                price_div = soup.find('div', {'class': 'YMlKec fxKbKc'})
                if price_div:
                    price_text = price_div.text.strip().replace('$', '').replace(',', '').replace('₹', '').replace('CA$', '')
                    return float(price_text)
    except Exception as e:
        logging.error(f"Error fetching price for {symbol}: {str(e)}")
    return None

# Helper function to fetch exchange rate from Alpha Vantage
async def fetch_exchange_rate(from_currency: str, to_currency: str) -> Optional[float]:
    try:
        api_key = os.environ.get('ALPHA_VANTAGE_KEY')
        if not api_key:
            return None
        url = f"https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency={from_currency}&to_currency={to_currency}&apikey={api_key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                rate = data.get('Realtime Currency Exchange Rate', {}).get('5. Exchange Rate')
                return float(rate) if rate else None
    except Exception as e:
        logging.error(f"Error fetching exchange rate: {str(e)}")
    return None

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=get_password_hash(user_data.password)
    )
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name}
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user['id']})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user['id'], "email": user['email'], "name": user['name']}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user['id'], "email": current_user['email'], "name": current_user['name']}

# Bank Accounts endpoints
@api_router.post("/accounts", response_model=BankAccount)
async def create_account(input: BankAccountCreate, current_user: dict = Depends(get_current_user)):
    account_dict = input.model_dump()
    account_obj = BankAccount(user_id=current_user['id'], **account_dict)
    doc = account_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bank_accounts.insert_one(doc)
    return account_obj

@api_router.get("/accounts", response_model=List[BankAccount])
async def get_accounts(current_user: dict = Depends(get_current_user)):
    accounts = await db.bank_accounts.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for account in accounts:
        if isinstance(account['created_at'], str):
            account['created_at'] = datetime.fromisoformat(account['created_at'])
    return accounts

@api_router.put("/accounts/{account_id}", response_model=BankAccount)
async def update_account(account_id: str, input: BankAccountCreate, current_user: dict = Depends(get_current_user)):
    account_dict = input.model_dump()
    account_obj = BankAccount(id=account_id, user_id=current_user['id'], **account_dict)
    doc = account_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = await db.bank_accounts.update_one({"id": account_id, "user_id": current_user['id']}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return account_obj

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.bank_accounts.delete_one({"id": account_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}

# Stocks endpoints
@api_router.post("/stocks", response_model=Stock)
async def create_stock(input: StockCreate, current_user: dict = Depends(get_current_user)):
    stock_dict = input.model_dump()
    stock_obj = Stock(user_id=current_user['id'], **stock_dict)
    doc = stock_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.stocks.insert_one(doc)
    return stock_obj

@api_router.get("/stocks", response_model=List[Stock])
async def get_stocks(current_user: dict = Depends(get_current_user)):
    stocks = await db.stocks.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for stock in stocks:
        if isinstance(stock['created_at'], str):
            stock['created_at'] = datetime.fromisoformat(stock['created_at'])
    return stocks

@api_router.put("/stocks/{stock_id}", response_model=Stock)
async def update_stock(stock_id: str, input: StockCreate, current_user: dict = Depends(get_current_user)):
    stock_dict = input.model_dump()
    stock_obj = Stock(id=stock_id, user_id=current_user['id'], **stock_dict)
    doc = stock_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = await db.stocks.update_one({"id": stock_id, "user_id": current_user['id']}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock_obj

@api_router.delete("/stocks/{stock_id}")
async def delete_stock(stock_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.stocks.delete_one({"id": stock_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted"}

# Mutual Funds endpoints
@api_router.post("/mutual-funds", response_model=MutualFund)
async def create_mutual_fund(input: MutualFundCreate, current_user: dict = Depends(get_current_user)):
    mf_dict = input.model_dump()
    mf_obj = MutualFund(user_id=current_user['id'], **mf_dict)
    doc = mf_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.mutual_funds.insert_one(doc)
    return mf_obj

@api_router.get("/mutual-funds", response_model=List[MutualFund])
async def get_mutual_funds(current_user: dict = Depends(get_current_user)):
    mfs = await db.mutual_funds.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for mf in mfs:
        if isinstance(mf['created_at'], str):
            mf['created_at'] = datetime.fromisoformat(mf['created_at'])
    return mfs

@api_router.put("/mutual-funds/{mf_id}", response_model=MutualFund)
async def update_mutual_fund(mf_id: str, input: MutualFundCreate, current_user: dict = Depends(get_current_user)):
    mf_dict = input.model_dump()
    mf_obj = MutualFund(id=mf_id, user_id=current_user['id'], **mf_dict)
    doc = mf_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = await db.mutual_funds.update_one({"id": mf_id, "user_id": current_user['id']}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mutual fund not found")
    return mf_obj

@api_router.delete("/mutual-funds/{mf_id}")
async def delete_mutual_fund(mf_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.mutual_funds.delete_one({"id": mf_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mutual fund not found")
    return {"message": "Mutual fund deleted"}

# Fixed Deposits endpoints
@api_router.post("/fixed-deposits", response_model=FixedDeposit)
async def create_fixed_deposit(input: FixedDepositCreate, current_user: dict = Depends(get_current_user)):
    fd_dict = input.model_dump()
    fd_obj = FixedDeposit(user_id=current_user['id'], **fd_dict)
    doc = fd_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.fixed_deposits.insert_one(doc)
    return fd_obj

@api_router.get("/fixed-deposits", response_model=List[FixedDeposit])
async def get_fixed_deposits(current_user: dict = Depends(get_current_user)):
    fds = await db.fixed_deposits.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for fd in fds:
        if isinstance(fd['created_at'], str):
            fd['created_at'] = datetime.fromisoformat(fd['created_at'])
    return fds

@api_router.put("/fixed-deposits/{fd_id}", response_model=FixedDeposit)
async def update_fixed_deposit(fd_id: str, input: FixedDepositCreate, current_user: dict = Depends(get_current_user)):
    fd_dict = input.model_dump()
    fd_obj = FixedDeposit(id=fd_id, user_id=current_user['id'], **fd_dict)
    doc = fd_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    result = await db.fixed_deposits.update_one({"id": fd_id, "user_id": current_user['id']}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fixed deposit not found")
    return fd_obj

@api_router.delete("/fixed-deposits/{fd_id}")
async def delete_fixed_deposit(fd_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.fixed_deposits.delete_one({"id": fd_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fixed deposit not found")
    return {"message": "Fixed deposit deleted"}

# Transactions endpoints
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate, current_user: dict = Depends(get_current_user)):
    trans_dict = input.model_dump()
    trans_obj = Transaction(user_id=current_user['id'], **trans_dict)
    doc = trans_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transactions.insert_one(doc)
    return trans_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    for trans in transactions:
        if isinstance(trans['created_at'], str):
            trans['created_at'] = datetime.fromisoformat(trans['created_at'])
    return transactions

@api_router.delete("/transactions/{trans_id}")
async def delete_transaction(trans_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.transactions.delete_one({"id": trans_id, "user_id": current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# Market data endpoints
@api_router.get("/market/price/{symbol}")
async def get_market_price(symbol: str, current_user: dict = Depends(get_current_user)):
    price = await fetch_google_finance_price(symbol)
    if price is None:
        raise HTTPException(status_code=404, detail="Price not found")
    return {"symbol": symbol, "price": price}

@api_router.get("/market/exchange-rate/{from_currency}/{to_currency}")
async def get_exchange_rate(from_currency: str, to_currency: str, current_user: dict = Depends(get_current_user)):
    rate = await fetch_exchange_rate(from_currency, to_currency)
    if rate is None:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    return {"from": from_currency, "to": to_currency, "rate": rate}

# Portfolio summary endpoint
@api_router.get("/portfolio/summary")
async def get_portfolio_summary(current_user: dict = Depends(get_current_user)):
    accounts = await db.bank_accounts.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    stocks = await db.stocks.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    mutual_funds = await db.mutual_funds.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    fixed_deposits = await db.fixed_deposits.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    
    # Calculate totals by currency
    totals = {"INR": 0, "CAD": 0, "USD": 0}
    
    for account in accounts:
        totals[account['currency']] = totals.get(account['currency'], 0) + account['balance']
    
    for stock in stocks:
        totals[stock['currency']] = totals.get(stock['currency'], 0) + (stock['quantity'] * stock['purchase_price'])
    
    for mf in mutual_funds:
        totals[mf['currency']] = totals.get(mf['currency'], 0) + (mf['units'] * mf['purchase_nav'])
    
    for fd in fixed_deposits:
        totals[fd['currency']] = totals.get(fd['currency'], 0) + fd['amount']
    
    return {
        "totals": totals,
        "counts": {
            "accounts": len(accounts),
            "stocks": len(stocks),
            "mutual_funds": len(mutual_funds),
            "fixed_deposits": len(fixed_deposits)
        },
        "by_country": {
            "india": {
                "accounts": len([a for a in accounts if a['country'].lower() == 'india']),
                "stocks": len([s for s in stocks if s['country'].lower() == 'india']),
                "mutual_funds": len([m for m in mutual_funds if m['country'].lower() == 'india']),
                "fixed_deposits": len([f for f in fixed_deposits if f['country'].lower() == 'india'])
            },
            "canada": {
                "accounts": len([a for a in accounts if a['country'].lower() == 'canada']),
                "stocks": len([s for s in stocks if s['country'].lower() == 'canada']),
                "mutual_funds": len([m for m in mutual_funds if m['country'].lower() == 'canada']),
                "fixed_deposits": len([f for f in fixed_deposits if f['country'].lower() == 'canada'])
            }
        }
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
