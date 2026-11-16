from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, or_, func
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from . import models, database

# Crear las tablas en la BD si no existen
models.Base.metadata.create_all(bind=database.engine)

# Migración automática segura en Neon.tech para asegurar las columnas de licenciamiento
try:
    with database.engine.begin() as conn:
        conn.execute(text("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plan_adquirido VARCHAR NULL;"))
        conn.execute(text("ALTER TABLE empresas ALTER COLUMN plan_adquirido DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE empresas ALTER COLUMN plan_adquirido DROP DEFAULT;"))
        conn.execute(text("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS hardware_id_vinculado VARCHAR NULL;"))
except Exception as e:
    print(f"Aviso en verificación de esquema: {e}")

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Configurar CORS para permitir peticiones desde el frontend local y el cliente ERP
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

# Esquema de Pydantic para activación de licencia por Hardware ID desde el ERP
class LicenciaActivar(BaseModel):
    email: Optional[str] = None
    nit: Optional[str] = None
    password: str
    hardware_id: str

# Esquema de Pydantic para selección y compra simulada de plan comercial
class SeleccionarPlanPayload(BaseModel):
    nit: str
    plan: str
    metodo_pago: Optional[str] = "demo_pasarela"
    referencia_pago: Optional[str] = None

MAPA_PLANES = {
    "free": "basico",
    "basico": "basico",
    "básico": "basico",
    "plus": "standart",
    "standart": "standart",
    "standard": "standart",
    "estandar": "standart",
    "ultra": "pro",
    "pro": "pro",
}

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
        hashed_password=hashed_pwd,
        plan_adquirido=None,
        hardware_id_vinculado=None
    )
    db.add(new_empresa)
    db.commit()
    return {"message": "Empresa registrada exitosamente", "plan": None}

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
        "nit": db_empresa.nit,
        "email": db_empresa.email,
        "plan": db_empresa.plan_adquirido,
        "software_download_url": "https://github.com/bill-zen-desarrollo/bill_zen_users/releases/download/1.0/BillZen.exe"
    }

@app.post("/api/plan/seleccionar")
def seleccionar_plan(payload: SeleccionarPlanPayload, db: Session = Depends(database.get_db)):
    nit_limpio = (payload.nit or "").strip()
    plan_clave = (payload.plan or "").strip().lower()
    if not nit_limpio:
        raise HTTPException(status_code=400, detail="El NIT de la empresa es obligatorio")
    if plan_clave not in MAPA_PLANES:
        raise HTTPException(status_code=400, detail="El plan seleccionado no es válido (usa basico, standart o pro)")

    plan_normalizado = MAPA_PLANES[plan_clave]
    db_empresa = db.query(models.Empresa).filter(models.Empresa.nit == nit_limpio).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="No se encontró la empresa con el NIT indicado")

    db_empresa.plan_adquirido = plan_normalizado
    db.commit()
    db.refresh(db_empresa)

    return {
        "ok": True,
        "status": "ok",
        "message": f"Plan {plan_normalizado.upper()} activado correctamente",
        "nit": db_empresa.nit,
        "razon_social": db_empresa.razon_social,
        "plan": db_empresa.plan_adquirido,
        "metodo_pago": payload.metodo_pago,
        "referencia_pago": payload.referencia_pago
    }

@app.get("/api/plan/estado")
def estado_plan(nit: str, db: Session = Depends(database.get_db)):
    db_empresa = db.query(models.Empresa).filter(models.Empresa.nit == nit.strip()).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return {
        "ok": True,
        "nit": db_empresa.nit,
        "razon_social": db_empresa.razon_social,
        "plan": db_empresa.plan_adquirido
    }

@app.post("/api/licencia/activar")
def activar_licencia(payload: LicenciaActivar, db: Session = Depends(database.get_db)):
    identificador = (payload.email or payload.nit or "").strip()
    if not identificador:
        raise HTTPException(status_code=400, detail="Debe proporcionar el email o el NIT de la empresa")

    hw_id = payload.hardware_id.strip()
    if not hw_id:
        raise HTTPException(status_code=400, detail="El hardware_id es obligatorio")

    # 1. Buscar la empresa por email (case-insensitive) o por NIT
    db_empresa = db.query(models.Empresa).filter(
        or_(
            func.lower(models.Empresa.email) == identificador.lower(),
            models.Empresa.nit == identificador
        )
    ).first()

    if not db_empresa:
        raise HTTPException(status_code=401, detail="Credenciales inválidas (empresa no encontrada en Neon.tech)")

    # 2. Validar contraseña con bcrypt
    if not bcrypt.checkpw(payload.password.encode('utf-8'), db_empresa.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Credenciales inválidas (contraseña incorrecta)")

    # 2.5 Verificar que la empresa ya haya seleccionado un plan en la web antes de activar el ERP
    if not db_empresa.plan_adquirido:
        raise HTTPException(
            status_code=403,
            detail="Tu empresa aún no ha seleccionado un plan comercial. Ingresa a nuestra página web en la sección Planes antes de activar el ERP."
        )

    # 3. Regla de negocio: Verificar vinculación de Hardware ID (Anticlones)
    hw_actual = (db_empresa.hardware_id_vinculado or "").strip()
    if hw_actual and hw_actual != hw_id:
        raise HTTPException(
            status_code=403,
            detail="Licencia ya vinculada a otro equipo físico diferente"
        )

    # 4. Vincular Hardware ID si estaba vacío y retornar plan comercial y datos de empresa
    if not hw_actual:
        db_empresa.hardware_id_vinculado = hw_id
        db.commit()
        db.refresh(db_empresa)

    return {
        "ok": True,
        "status": "ok",
        "plan": db_empresa.plan_adquirido or "basico",
        "plan_adquirido": db_empresa.plan_adquirido or "basico",
        "razon_social": db_empresa.razon_social,
        "nit": db_empresa.nit,
        "email": db_empresa.email,
        "nombres_admin": db_empresa.nombres_admin or "Administrador",
        "apellidos_admin": db_empresa.apellidos_admin or ""
    }
