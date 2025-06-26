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

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # secure this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/gemini")
async def ask_gemini(req: Request):
    # return {"error" : "NO"}
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
    

@app.post("/submit_case")
async def submit_case(
    doctorFirstName: Optional[str] = Form(None),  # ✅ now optional
    doctorLastName: Optional[str] = Form(None),
    patientId: str = Form(None),  # 🔴 still required
    sampleCollectionDate: Optional[str] = Form(None),
    testIndication: str = Form(None),
    selectedDimension: str = Form(None),
    files: List[UploadFile] = File(default=[])
):
    images = []

    print((files))

    for file in files:
        contents = await file.read()
        filename = file.filename

        if filename.endswith(".nii") or filename.endswith(".nii.gz"):
            # Read .nii file
            nii_img = nib.load(io.BytesIO(contents))
            data = nii_img.get_fdata()

            for i in range(min(10, data.shape[2])):  # First 10 slices
                slice_img = Image.fromarray(data[:, :, i]).convert("L")
                buffer = io.BytesIO()
                slice_img.save(buffer, format="PNG")
                base64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")
                images.append(f"data:image/png;base64,{base64_img}")

        elif filename.endswith((".jpg", ".jpeg", ".png")):
            base64_img = base64.b64encode(contents).decode("utf-8")
            images.append(f"data:image/png;base64,{base64_img}")

        # Handle .pdf or others here if needed

    reply = f"✅ Received {len(files)} file(s). Processed {len(images)} image(s)."
    return {"reply": reply, "images": images}