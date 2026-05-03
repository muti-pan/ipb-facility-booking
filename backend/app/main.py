from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, facilities, bookings, admin, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IPB Campus Facility System",
    description="Sistem Peminjaman Fasilitas Kampus IPB",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(facilities.router, prefix="/api/facilities", tags=["facilities"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

@app.get("/")
def root():
    return {"message": "IPB Facility System API v1.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
