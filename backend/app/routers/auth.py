from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserResponse
from app.utils.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check email unique
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        nama=user_data.nama,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        nim=user_data.nim,
        id_pegawai=user_data.id_pegawai,
        unit_kerja=user_data.unit_kerja
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah"
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun tidak aktif")

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    # JWT is stateless; client should delete token
    return {"message": "Logout berhasil"}
