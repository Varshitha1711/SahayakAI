from fastapi import FastAPI

from app.routes.schemes import router as schemes_router

from app.routes.recommendations import (
    router as recommendations_router
)

app = FastAPI()

app.include_router(
    schemes_router
)

app.include_router(
    recommendations_router
)