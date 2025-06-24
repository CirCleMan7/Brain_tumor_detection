from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import traceback
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/gemini")
async def ask_gemini(req: Request):
    try:
        data = await req.json()
        prompt = data.get("prompt")
        print("Prompt received:", prompt)

        if not prompt or not prompt.strip():
            return {"error": "No prompt provided"}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        print("Payload:", payload)

        async with httpx.AsyncClient(timeout=30.0) as client:  # Wait up to 30 seconds
            res = await client.post(url, headers=headers, json=payload)
            print("Gemini status:", res.status_code)
            print("Gemini response:", res.text)

            try:
                res_json = res.json()
            except Exception as e:
                print("❌ Failed to parse JSON from Gemini:")
                traceback.print_exc()
                return {
                    "error": "Invalid JSON from Gemini",
                    "status": res.status_code,
                    "raw_response": res.text
                }

        try:
            reply = res_json["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": reply}
        except Exception as e:
            print("❌ Unexpected Gemini response structure:")
            traceback.print_exc()
            return {
                "error": "Unexpected Gemini response format",
                "data": res_json
            }

    except Exception as e:
        print("❌ Outer exception occurred:")
        traceback.print_exc()
        return {
            "error": "Internal server error",
            "message": str(e),
            "trace": traceback.format_exc()
        }
