# === Standard Library ===
import os
import io
import uuid
import tempfile
import traceback
from typing import List, Optional, Tuple

# === Third-Party Libraries ===
import numpy as np
import cv2
import nibabel as nib
from PIL import Image
import tensorflow as tf
from dotenv import load_dotenv
import base64
import httpx

# === FastAPI & Starlette ===
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

# === Local Project Modules ===
from convert_utils import load_image_from_any_format
from unet_predict import (
    predict_image,
    create_overlay,
    evaluate_array,
    visualize_mask,
    get_detected_tumor_types,
)

load_dotenv()
FLOWISE_API_URL = "https://cloud.flowiseai.com/api/v1/prediction/08f57a86-be58-494b-aed2-6640416b4a35"

app = FastAPI()

from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from starlette.types import Scope

class NoCacheStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope):
        response = await super().get_response(path, scope)
        if path.endswith(".nii") or path.endswith(".nii.gz"):
            # Disable caching for .nii files
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

# Then mount with this custom static files handler:
app.mount("/files", NoCacheStaticFiles(directory="static/files"), name="files")

# app.mount("/files", StaticFiles(directory="static/files"), name="files")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # secure this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- File Directory Setup ---
# Define the directory where your NIfTI files are stored on the server.
# Adjust this path as needed. This example assumes a folder 'nifti_files'
# is in the same directory as your main.py.
NIFTI_FILE_DIR = os.path.join(os.getcwd(), 'nifti_files')

# Ensure the directory exists (create it if it doesn't)
os.makedirs(NIFTI_FILE_DIR, exist_ok=True)

# ========================================================================================================================
# 3D model setup code

# === Model Config ===
MODEL_PATH = "models/best_model.keras"
IMG_SIZE = 128
VOLUME_SLICES = 100
VOLUME_START_AT = 22
SEGMENT_CLASSES = {
    0: 'NOT_tumor', 1: 'NECROTIC_CORE', 2: 'EDEMA', 3: 'ENHANCING'
}


# === Dummy Metrics to Load Model ===
def dice_coef(y_true, y_pred, smooth=1e-6): return 0.0
def precision(y_true, y_pred): return 0.0
def sensitivity(y_true, y_pred): return 0.0
def specificity(y_true, y_pred): return 0.0
def dice_coef_necrotic(y_true, y_pred): return 0.0
def dice_coef_edema(y_true, y_pred): return 0.0
def dice_coef_enhancing(y_true, y_pred): return 0.0

CUSTOM_OBJECTS = {
    'dice_coef': dice_coef, 'precision': precision, 'sensitivity': sensitivity,
    'specificity': specificity, 'dice_coef_necrotic': dice_coef_necrotic,
    'dice_coef_edema': dice_coef_edema, 'dice_coef_enhancing': dice_coef_enhancing
}

model = tf.keras.models.load_model(MODEL_PATH, custom_objects=CUSTOM_OBJECTS)

# === 3D NIfTI Preprocess ===
# --- 4. โหลดโมเดลเมื่อเริ่มต้น App ---
@app.on_event("startup")
def load_model():
    print(f"Loading model from: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        print(f"FATAL ERROR: Model file not found at {MODEL_PATH}")
        app.state.model = None
        return
    app.state.model = tf.keras.models.load_model(MODEL_PATH, custom_objects=CUSTOM_OBJECTS)
    print("Model loaded successfully!")

# --- 5. ฟังก์ชัน Preprocess ข้อมูล NIfTI (แก้ไข) ---
### NEW: แก้ไขให้ฟังก์ชันคืนค่า voxel_dims และ original_shape ด้วย ###
def preprocess_nifti(flair_file_bytes: bytes, t1ce_file_bytes: bytes) -> Tuple[np.ndarray, tuple, tuple]:
    """
    อ่านไฟล์ NIfTI จาก bytes, ประมวลผล, stack เป็น volume,
    และคืนค่าข้อมูลที่ประมวลผลแล้ว, ขนาด voxel, และ shape ดั้งเดิม
    """
    try:
        flair_nifti_file = None
        # ใช้ไฟล์ FLAIR เป็นหลักในการดึงข้อมูล header
        flair_bytes_io = io.BytesIO(flair_file_bytes)
        if flair_file_bytes[:2] == b'\x1f\x8b':
            with gzip.GzipFile(fileobj=flair_bytes_io) as f:
                flair_nifti_file = nib.Nifti1Image.from_stream(f)
        else:
            flair_nifti_file = nib.Nifti1Image.from_stream(flair_bytes_io)

        flair_data = flair_nifti_file.get_fdata()
        
        ### NEW: ดึงข้อมูล Voxel Spacing และ Shape ดั้งเดิมจาก Header ###
        voxel_dims = flair_nifti_file.header.get_zooms()
        original_shape = flair_nifti_file.shape

        def read_nifti_from_bytes(file_bytes):
            bytes_io = io.BytesIO(file_bytes)
            if file_bytes[:2] == b'\x1f\x8b':
                with gzip.GzipFile(fileobj=bytes_io) as f:
                    nifti_file = nib.Nifti1Image.from_stream(f)
            else:
                nifti_file = nib.Nifti1Image.from_stream(bytes_io)
            return nifti_file.get_fdata()

        t1ce_data = read_nifti_from_bytes(t1ce_file_bytes)

        processed_volume = np.zeros((VOLUME_SLICES, IMG_SIZE, IMG_SIZE, 2))
        for j in range(VOLUME_SLICES):
            slice_idx = j + VOLUME_START_AT
            if slice_idx >= flair_data.shape[2] or slice_idx >= t1ce_data.shape[2]:
                continue
            flair_slice = cv2.resize(flair_data[:, :, slice_idx], (IMG_SIZE, IMG_SIZE))
            t1ce_slice = cv2.resize(t1ce_data[:, :, slice_idx], (IMG_SIZE, IMG_SIZE))
            processed_volume[j, :, :, 0] = flair_slice
            processed_volume[j, :, :, 1] = t1ce_slice
        
        max_val = np.max(processed_volume)
        if max_val > 0:
            processed_volume = processed_volume / max_val
            
        return processed_volume, voxel_dims, original_shape

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to preprocess NIfTI files: {str(e)}")
    
# --- 6. ฟังก์ชันสำหรับจัดกลุ่มตัวเลขเป็นช่วง ---
def format_slice_ranges(slice_numbers: List[int]) -> str:
    if not slice_numbers: return "Not found"
    nums = sorted(list(set(slice_numbers)))
    ranges, start_range = [], nums[0]
    for i in range(1, len(nums)):
        if nums[i] != nums[i-1] + 1:
            end_range = nums[i-1]
            if start_range == end_range: ranges.append(f"{start_range}")
            else: ranges.append(f"{start_range}-{end_range}")
            start_range = nums[i]
    if start_range == nums[-1]: ranges.append(f"{start_range}")
    else: ranges.append(f"{start_range}-{nums[-1]}")
    return ", ".join(ranges)


# ========================================================================================================================

# ----------- Flowise API -----------
@app.post("/flowise")
async def ask_flowise(req: Request):
    # return {"error": "FLOWISE_API_URL is not set in environment variables"}
    print("📨 Flowise request received")
    if not FLOWISE_API_URL:
        return {"error": "FLOWISE_API_URL is not set in environment variables"}
    try:
        data = await req.json()
        # prompt = data.get("prompt")
        # print("📨 Flowise prompt received:", prompt)
        # if not prompt or not prompt.strip():
        #     return {"error": "No prompt provided"}
        
        question = data.get("question")
        # 2. Get the 'uploads' array (your image data)
        # uploads = data.get("uploads")

        files = []
        # for upload in uploads:  # uploads can be dict with base64 string and filename, mime, etc.
        #     base64_str = upload["data"]
        #     filename = upload.get("name", "file")
        #     mime = upload.get("mime", "application/octet-stream")
            
        #     # Decode base64 to bytes
        #     file_bytes = base64.b64decode(base64_str)
            
        #     # Prepare file tuple for requests.post
        #     files.append(("files", (filename, io.BytesIO(file_bytes), mime)))

        if not question or not isinstance(question, str) or not question.strip():
            return {"error": "No valid question provided"}

        # if not uploads or not isinstance(uploads, list):
        #     return {"error": "Uploads must be a non-empty list"}

        # for i, upload in enumerate(uploads):
        #     if "data" not in upload or not upload["data"]:
        #         return {"error": f"Upload at index {i} missing 'data' field"}

        print("📨 Flowise question received:", question)
        # print("📨 Flowise uploads received (full data):",
        #       uploads[0]['data'] if uploads and uploads[0].get('data') else "No uploads or data")

        if not question or not question.strip():
            return {"error": "No question provided"}

        # Construct the payload for Flowise, including both question and uploads
        # payload_to_flowise = {
        #     "question": question,
        #     "uploads": uploads # Pass the entire uploads array received from frontend
        # }

        payload = {
            "question": question,
            # "uploads": [
            #     {
            #         "data": base64_str,
            #         "name": "example.png",
            #         "mime": "image/png"
            #     }
            # ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            print("📨 Sending request to Flowise API:", FLOWISE_API_URL)
            response = await client.post(FLOWISE_API_URL, json=payload)
            print("📨 Flowise response status:", response.status_code)
        try:
            result = response.json()
        except Exception:
            print("❌ Failed to parse Flowise JSON")
            return {
                "error": "Invalid JSON from Flowise",
                "status": response.status_code,
                "raw_response": response.text
            }
        print("📨 Flowise response:", result)
        return {"reply": result}
    except Exception as e:
        print("❌ Flowise exception occurred:")
        traceback.print_exc()
        return {
            "error": "Internal server error",
            "message": str(e),
            "trace": traceback.format_exc()
        }
    
# Load environment variables
# Make sure to set GEMINI_API_KEY in your environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini API endpoint for gemini-2.0-flash (multimodal)
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


@app.post("/gemini_ask") # Changed the endpoint path
async def ask_gemini(req: Request):
    """
    Receives a question and image uploads from the client,
    and forwards them to the Gemini API for multimodal generation.
    """
    print("📨 Gemini API request received from client")

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY is not set in environment variables.")
        return JSONResponse(
            status_code=500,
            content={"error": "GEMINI_API_KEY is not set in environment variables"}
        )

    try:
        data = await req.json()

        question = data.get("question")
        uploads = data.get("uploads") # Expected to be an array of image objects

        print("📨 Question received:", question)
        print(f"📨 Number of uploads received: {len(uploads) if uploads else 0}")

        if not question and not uploads:
            return JSONResponse(
                status_code=400,
                content={"error": "No question or uploads provided"}
            )

        # Construct the 'contents' array for the Gemini API payload
        contents = []

        # Add the text part if a question is provided
        if question and question.strip():
            contents.append({"role": "user", "parts": [{"text": question}]})

        # Add image parts from uploads
        if uploads:
            for upload in uploads:
                image_data_base64 = upload.get('data')
                mime_type = upload.get('mime') # Assuming 'mime' field holds the MIME type
                filename = upload.get('name', 'unknown_image')

                if image_data_base64 and mime_type:
                    # Gemini API expects 'inlineData' with 'mimeType' and 'data' (Base64 string)
                    contents.append({
                        "role": "user",
                        "parts": [{
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": image_data_base64
                            }
                        }]
                    })
                    print(f"✅ Added image '{filename}' ({mime_type}) to Gemini payload.")
                else:
                    print(f"⚠️ Skipping upload '{filename}' due to missing data or MIME type.")

        # Construct the full payload for the Gemini API
        payload_to_gemini = {
            "contents": contents
        }

        # Add API key to the URL
        api_request_url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

        async with httpx.AsyncClient(timeout=60.0) as client: # Increased timeout for potential large image uploads
            print("📨 Sending request to Gemini API...")
            response = await client.post(api_request_url, json=payload_to_gemini)
            print("📨 Gemini API response status:", response.status_code)

        try:
            result = response.json()
        except Exception:
            print("❌ Failed to parse Gemini API JSON response.")
            return JSONResponse(
                status_code=response.status_code if response.status_code != 200 else 500,
                content={
                    "error": "Invalid JSON from Gemini API",
                    "status": response.status_code,
                    "raw_response": response.text
                }
            )

        print("📨 Gemini API raw response:", result)

        # Extract the text reply from Gemini's response
        gemini_reply = ""
        if result and result.get("candidates"):
            for candidate in result["candidates"]:
                if candidate.get("content") and candidate["content"].get("parts"):
                    for part in candidate["content"]["parts"]:
                        if part.get("text"):
                            gemini_reply += part["text"]
        
        if not gemini_reply:
            print("⚠️ No text reply found in Gemini API response.")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "No text reply found in Gemini API response",
                    "gemini_raw_response": result
                }
            )

        return JSONResponse(
            status_code=200,
            content={"reply": gemini_reply}
        )

    except Exception as e:
        print("❌ An exception occurred during Gemini API request processing:")
        traceback.print_exc() # Print full traceback for debugging
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": str(e),
                "trace": traceback.format_exc()
            }
        )

@app.delete("/delete_file")
async def delete_file(filepath: str = Query(..., description="Path to the file to delete")):
    abs_path = os.path.abspath(filepath)

    if not abs_path.startswith(os.path.abspath("static/files")):
        raise HTTPException(status_code=403, detail="Invalid file path")

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(abs_path)
        return {"detail": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")


# === Main /submit_case ===
@app.post("/submit_case")
async def submit_case(
    doctorFirstName: Optional[str] = Form(None),
    doctorLastName: Optional[str] = Form(None),
    patientId: Optional[str] = Form(None),
    sampleCollectionDate: Optional[str] = Form(None),
    testIndication: Optional[str] = Form(None),
    selectedDimension: Optional[str] = Form(None),
    # files: Optional[List[UploadFile]] = File(None),
    flairFiles: Optional[List[UploadFile]] = File(None),
    t1ceFiles: Optional[List[UploadFile]] = File(None),
):
    try:
        print(flairFiles)
        print(t1ceFiles)
        if selectedDimension == "3D":
            flair_bytes = await flairFiles[0].read()
            t1ce_bytes = await t1ceFiles[0].read()

            if not flair_bytes or not t1ce_bytes:
                raise HTTPException(status_code=400, detail="Missing FLAIR or T1CE file")

            print("process 1")

            processed, voxel_dims, original_shape = preprocess_nifti(flair_bytes, t1ce_bytes)
            raw_prediction = model.predict(processed)

            # max_probs = np.max(raw_prediction, axis=-1)
            # class_indices = np.argmax(raw_prediction, axis=-1)
            # mask = np.zeros_like(class_indices, dtype=np.uint8)
            # mask[max_probs >= 0.5] = class_indices[max_probs >= 0.5]
            mask = np.argmax(raw_prediction, axis=-1).astype(np.uint8)

            print("process 2")

            # --- Tumor volume calculation ---
            try:
                vx, vy, vz = voxel_dims
                resized_voxel_volume_mm3 = (vx * original_shape[0] / IMG_SIZE) * \
                                        (vy * original_shape[1] / IMG_SIZE) * \
                                        vz

                voxel_counts = {
                    1: np.sum(mask == 1),
                    2: np.sum(mask == 2),
                    3: np.sum(mask == 3),
                }

                volumes_cm3 = {
                    SEGMENT_CLASSES[label]: (count * resized_voxel_volume_mm3) / 1000.0
                    for label, count in voxel_counts.items() if count > 0
                }

                total_volume_cm3 = sum(volumes_cm3.values())
                volume_details = [f"{label.split('_')[0]}: {vol:.2f} cm³" for label, vol in volumes_cm3.items()]
                volume_str = f"Total: {total_volume_cm3:.2f} cm³ ({'; '.join(volume_details)})"
            except Exception as e:
                print(f"[Volume Error] {e}")
                volume_str = "N/A"

            # --- Slices and labels ---
            tumor_slices_numbers = [i for i in range(mask.shape[0]) if np.any(mask[i] > 0)]
            tumor_slices_str = format_slice_ranges(tumor_slices_numbers)

            unique_labels = np.unique(mask)
            predicted_labels_list = [label for label in unique_labels if label in SEGMENT_CLASSES and label != 0]
            predicted_labels_str = ", ".join([SEGMENT_CLASSES[label] for label in predicted_labels_list]) if predicted_labels_list else "Not found"

            print(predicted_labels_str)

            # --- Save NIfTI files ---
            case_id = str(uuid.uuid4())
            flair_filename = f"flair_{case_id}.nii"
            t1ce_filename  = f"t1ce_{case_id}.nii"
            seg_filename   = f"seg_{case_id}.nii"

            save_dir = "static/files/3D_images"
            os.makedirs(save_dir, exist_ok=True)

            flair_path = os.path.join(save_dir, flair_filename)
            t1ce_path  = os.path.join(save_dir, t1ce_filename)
            seg_path   = os.path.join(save_dir, seg_filename)

            with open(flair_path, "wb") as f:
                f.write(flair_bytes)
            with open(t1ce_path, "wb") as f:
                f.write(t1ce_bytes)

            seg_img = nib.Nifti1Image(mask, affine=np.eye(4))
            nib.save(seg_img, seg_path)

            print("process 3")

            base_url = "http://localhost:8000/files/3D_images"
            return {
                "reply": f"🧠 3D segmentation complete with labels: {predicted_labels_str}",
                "predicted_labels": predicted_labels_str,
                "tumor_volume": volume_str,
                "tumor_slices": tumor_slices_str,
                "image_urls": [
                    f"{base_url}/{flair_filename}",
                    f"{base_url}/{t1ce_filename}",
                    f"{base_url}/{seg_filename}"
                ]
            }

        elif selectedDimension == "2D":
            
            flair_file = flairFiles[0] if flairFiles else None
            if not flair_file:
                raise HTTPException(status_code=400, detail="Missing 2D image file")

            # Save uploaded image
            case_id = str(uuid.uuid4())
            filename = f"2d_input_{uuid.uuid4().hex}_{flair_file.filename}"
            save_dir = "static/files/2D_images"
            os.makedirs(save_dir, exist_ok=True)
            filepath = os.path.join(save_dir, filename)

            contents = await flair_file.read()
            with open(filepath, "wb") as f:
                f.write(contents)

            # Clean up old output images
            for fname in ["output_mask.png", "overlay.png", "original_mask.png", "input_image.png"]:
                try:
                    os.remove(os.path.join(save_dir, fname))
                except FileNotFoundError:
                    pass

            # Convert input image
            try:
                image_path = load_image_from_any_format(filepath)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error loading input image: {str(e)}")

            # Predict
            try:
                pred, original_img = predict_image(image_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

            overlay = create_overlay(original_img, pred)
            mask_vis = visualize_mask(pred)

            # Save output images
            out_mask = os.path.join(save_dir, f"{case_id}_output_mask.png")
            out_overlay = os.path.join(save_dir, f"{case_id}_overlay.png")
            input_img_path = os.path.join(save_dir, f"{case_id}_input_image.png")

            cv2.imwrite(out_mask, mask_vis)
            cv2.imwrite(out_overlay, overlay)
            cv2.imwrite(input_img_path, original_img)

            # --- Handle optional mask upload ---
            mask_file = t1ceFiles[0] if t1ceFiles else None
            mask_array = None
            mask_input_url = None
            # You can add maskFiles: Optional[List[UploadFile]] = File(None) in your endpoint params
            # Here is an example assuming you get mask file as separate UploadFile (adjust accordingly)

            if mask_file:
                try:
                    mask_bytes = await mask_file.read()
                    mask_filename = mask_file.filename.lower()
                    print("mask file processing")
                    if mask_filename.endswith(".npy"):
                        mask_array = np.load(io.BytesIO(mask_bytes), allow_pickle=True)
                        mask_array_vis = ((mask_array - mask_array.min()) / (mask_array.max() - mask_array.min() + 1e-8) * 255).astype(np.uint8)
                        mask_array_vis = cv2.cvtColor(mask_array_vis, cv2.COLOR_GRAY2BGR)
                    else:
                        mask_img = Image.open(io.BytesIO(mask_bytes)).convert("L")
                        mask_array = np.array(mask_img)
                        mask_array_vis = cv2.cvtColor(mask_array, cv2.COLOR_GRAY2BGR)

                    orig_mask_path = os.path.join(save_dir, "original_mask.png")
                    cv2.imwrite(orig_mask_path, mask_array_vis)
                    mask_input_url = f"/files/original_mask.png"
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Error loading mask: {str(e)}")

            # Evaluate if mask is provided
            metrics = evaluate_array(pred_mask=pred, true_mask=mask_array) if mask_array is not None else None

            tumor_type_predict = get_detected_tumor_types(pred)

            # ❌ Clean up the uploaded input file after processing
            try:
                os.remove(filepath)
            except FileNotFoundError:
                pass

            base_url = "http://localhost:8000/files/2D_images"
            return {
                "reply": "✅ 2D brain segmentation complete.",
                "image_urls": [
                    f"{base_url}/{case_id}_input_image.png",
                    f"{base_url}/{case_id}_output_mask.png",
                    f"{base_url}/{case_id}_overlay.png",
                ],
                "original_mask_url": mask_input_url,
                "metrics": metrics,
                "tumor_type_predict": tumor_type_predict
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})