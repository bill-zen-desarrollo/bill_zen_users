from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from . import models, database

# Crear las tablas en la BD si no existen
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Configuración para encriptar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de Pydantic para recibir los datos del frontend
class UserCreate(BaseModel):
    email: str
    password: str

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    # 1. Verificar si el usuario ya existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Encriptar contraseña y guardar
    hashed_pwd = pwd_context.hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"message": "Usuario registrado exitosamente"}

@app.post("/api/login")
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    # 1. Buscar al usuario
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    # 2. Verificar contraseña
    if not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    return {"message": "Login exitoso", "software_download_url": "URL_DEL_SOFTWARE_AQUI"}