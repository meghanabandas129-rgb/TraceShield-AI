
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.fraud import router as fraud_router
from app.tracing.engine import router as tracing_router


# Create the FastAPI application
app = FastAPI(
    title="TraceShield AI",
    description=(
        "AI-Powered Financial Fraud Detection "
        "and Money Tracing Platform"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# Register Fraud Detection API
app.include_router(fraud_router)


# Register Money Tracing API
app.include_router(tracing_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to TraceShield AI",
        "service": "Financial Fraud Detection and Tracing",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TraceShield AI Backend",
    }
