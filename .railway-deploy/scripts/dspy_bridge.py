#!/usr/bin/env python3
"""
DSPy Bridge Service (FastAPI)

Provides a secure HTTP bridge between the Node app and DSPy (prompt optimization).
Security: Token authentication (DSPY_API_TOKEN), rate limiting, CORS, no eval/exec.
"""

import os
import time
import hmac
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

PORT = int(os.getenv("DSPY_PORT", "8765"))
API_TOKEN = os.getenv("DSPY_API_TOKEN", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="DSPy Bridge (FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Very simple rate limiter (in-memory) - good for stubs
REQUEST_COUNTS = {}
RATE_LIMIT = int(os.getenv("DSPY_RATE_LIMIT", "100"))
RATE_WINDOW = int(os.getenv("DSPY_RATE_WINDOW", "60"))

def validate_token(auth_header: Optional[str]) -> bool:
    if not API_TOKEN:
        return False
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return False
    token = auth_header[7:]
    return hmac.compare_digest(token, API_TOKEN)

def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    reqs = REQUEST_COUNTS.get(client_ip, [])
    # Remove old
    reqs = [t for t in reqs if now - t < RATE_WINDOW]
    if len(reqs) >= RATE_LIMIT:
        return False
    reqs.append(now)
    REQUEST_COUNTS[client_ip] = reqs
    return True

@app.get("/health")
def health():
    return {"status": "healthy", "service": "dspy-bridge", "timestamp": int(time.time())}

@app.post("/optimize")
async def optimize(request: Request, authorization: Optional[str] = Header(None)):
    client_ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too Many Requests")

    if not validate_token(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    body = await request.json()
    prompt = body.get("prompt")
    if not prompt or not isinstance(prompt, str):
        raise HTTPException(status_code=400, detail="Invalid request: prompt required")
    if len(prompt) > 10000:
        raise HTTPException(status_code=400, detail="Prompt too long (max 10000 chars)")

    try:
        # Try to import DSPy library (optional). If not found, fallback to stub
        try:
            import dspy  # type: ignore
            # Real DSPy optimization would go here
            optimized_prompt = f"{prompt}\n\n[Optimized by DSPy]"  # placeholder
            method = "dspy"
        except Exception:
            optimized_prompt = f"{prompt}\n\n[Note: DSPy not installed — using stub]"
            method = "stub"

        response = {
            "optimized_prompt": optimized_prompt,
            "metadata": {"method": method, "timestamp": int(time.time())},
        }
        return JSONResponse(status_code=200, content=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    if not API_TOKEN:
        print("ERROR: DSPY_API_TOKEN not set", flush=True)
        raise SystemExit(1)
    else:
        # Non-sensitive startup log for CI visibility (do not print the token)
        print("DSPy Bridge starting (token set)", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
# Keep only FastAPI implementation above - the classic HTTPServer stub has been removed
