from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from . import models, database

# Crear las tablas en la BD si no existen
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Configurar CORS para permitir peticiones desde el frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción restringe esto al dominio de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquema de Pydantic para el registro
class EmpresaCreate(BaseModel):
    razon_social: str
    nit: str
    nombres_admin: str
    apellidos_admin: str
    email: str
    password: str

# Esquema de Pydantic para el login
class EmpresaLogin(BaseModel):
    nit: str
    password: str

@app.post("/api/register")
def register(empresa: EmpresaCreate, db: Session = Depends(database.get_db)):
    # 1. Verificar si la empresa ya existe (por NIT o Email)
    db_empresa_nit = db.query(models.Empresa).filter(models.Empresa.nit == empresa.nit).first()
    if db_empresa_nit:
        raise HTTPException(status_code=400, detail="El NIT ya está registrado")
        
    db_empresa_email = db.query(models.Empresa).filter(models.Empresa.email == empresa.email).first()
    if db_empresa_email:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Encriptar contraseña y guardar
    hashed_pwd = bcrypt.hashpw(empresa.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_empresa = models.Empresa(
        razon_social=empresa.razon_social,
        nit=empresa.nit,
        nombres_admin=empresa.nombres_admin,
        apellidos_admin=empresa.apellidos_admin,
        email=empresa.email,
        hashed_password=hashed_pwd
    )
    db.add(new_empresa)
    db.commit()
    return {"message": "Empresa registrada exitosamente"}

@app.post("/api/login")
def login(empresa: EmpresaLogin, db: Session = Depends(database.get_db)):
    # 1. Buscar a la empresa por NIT
    db_empresa = db.query(models.Empresa).filter(models.Empresa.nit == empresa.nit).first()
    if not db_empresa:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas (NIT no encontrado)")
    
    # 2. Verificar contraseña
    if not bcrypt.checkpw(empresa.password.encode('utf-8'), db_empresa.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas (contraseña inválida)")
    
    return {
        "message": "Login exitoso", 
        "nombre_empresa": db_empresa.razon_social,
        "software_download_url": "URL_DEL_SOFTWARE_AQUI"
    }