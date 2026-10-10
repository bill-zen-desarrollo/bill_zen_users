from sqlalchemy import Column, Integer, String
from .database import Base

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String, index=True)
    nit = Column(String, unique=True, index=True)
    nombres_admin = Column(String)
    apellidos_admin = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)