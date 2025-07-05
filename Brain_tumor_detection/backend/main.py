from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import traceback
from dotenv import load_dotenv

from typing import List
import shutil
import nibabel as nib
from PIL import Image
import io
import base64

from typing import Optional

import tempfile


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # secure this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/gemini")
async def ask_gemini(req: Request):
    # return {"error": "No prompt"}
    try:
        data = await req.json()
        prompt = data.get("prompt")
        print("📨 Prompt received:", prompt)

        if not prompt or not prompt.strip():
            return {"error": "No prompt provided"}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        print("📦 Sending to Gemini:", payload)

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            print("📬 Gemini status:", res.status_code)
            print("📨 Raw response text:", res.text)

            try:
                res_json = res.json()
            except Exception:
                print("❌ Failed to parse JSON from Gemini")
                traceback.print_exc()
                return {
                    "error": "Invalid JSON from Gemini",
                    "status": res.status_code,
                    "raw_response": res.text
                }

        try:
            candidates = res_json.get("candidates", [])
            if not candidates:
                raise ValueError("Missing 'candidates'")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts or "text" not in parts[0]:
                raise ValueError("Missing 'text' in parts")

            reply = parts[0]["text"]
            return {"reply": reply}

        except Exception:
            print("❌ Unexpected Gemini response structure")
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
    

import tempfile
import os

@app.post("/submit_case")
async def submit_case(
    doctorFirstName: Optional[str] = Form(None),
    doctorLastName: Optional[str] = Form(None),
    patientId: Optional[str] = Form(None),
    sampleCollectionDate: Optional[str] = Form(None),
    testIndication: Optional[str] = Form(None),
    selectedDimension: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[])
):
    images = []

    for file in files:
        try:
            contents = await file.read()
            filename = file.filename

            if filename.endswith((".nii", ".nii.gz")):
                # Detect proper suffix
                suffix = ".nii.gz" if filename.endswith(".nii.gz") else ".nii"

                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(contents)
                    tmp_path = tmp.name

                nii_img = nib.load(tmp_path)
                data = nii_img.get_fdata()

                for i in range(min(10, data.shape[2])):
                    slice_data = data[:, :, i]
                    norm = (slice_data - slice_data.min()) / (slice_data.max() - slice_data.min() + 1e-5)
                    uint8_slice = (norm * 255).astype("uint8")

                    img = Image.fromarray(uint8_slice).convert("L")
                    buffer = io.BytesIO()
                    img.save(buffer, format="PNG")
                    base64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")
                    images.append(f"data:image/png;base64,{base64_img}")

                os.remove(tmp_path)

            elif filename.endswith((".jpg", ".jpeg", ".png")):
                base64_img = base64.b64encode(contents).decode("utf-8")
                images.append(f"data:image/png;base64,{base64_img}")

        except Exception as e:
            print(f"❌ Failed to process {file.filename}, error: {e}")

    return {
        "reply": f"✅ Received {len(files)} file(s). Processed {len(images)} image(s).",
        "images": images
    }
