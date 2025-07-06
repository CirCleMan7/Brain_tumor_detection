# === Standard Library ===
import os
import io
import uuid
import tempfile
import traceback
from typing import List, Optional

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
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

# === Local Project Modules ===
from convert_utils import load_image_from_any_format
from unet_predict import (
    predict_image,
    create_overlay,
    evaluate_array,
    visualize_mask
)



load_dotenv()
FLOWISE_API_URL = "https://cloud.flowiseai.com/api/v1/prediction/08f57a86-be58-494b-aed2-6640416b4a35"

app = FastAPI()
app.mount("/files", StaticFiles(directory="static/files"), name="files")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # secure this in prod
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
def preprocess_nifti(flair_bytes, t1ce_bytes):
    flair_data = read_nifti_from_bytes(flair_bytes)
    t1ce_data = read_nifti_from_bytes(t1ce_bytes)

    X = np.zeros((VOLUME_SLICES, IMG_SIZE, IMG_SIZE, 2))
    for j in range(VOLUME_SLICES):
        slice_idx = j + VOLUME_START_AT
        if slice_idx >= flair_data.shape[2] or slice_idx >= t1ce_data.shape[2]:
            continue
        flair_slice = cv2.resize(flair_data[:, :, slice_idx], (IMG_SIZE, IMG_SIZE))
        t1ce_slice = cv2.resize(t1ce_data[:, :, slice_idx], (IMG_SIZE, IMG_SIZE))
        X[j, :, :, 0] = flair_slice
        X[j, :, :, 1] = t1ce_slice

    max_val = np.max(X)
    if max_val > 0:
        X = X / max_val
    return X

def read_nifti_from_bytes(file_bytes):
    # Detect correct suffix from magic bytes
    suffix = ".nii.gz" if file_bytes[:2] == b'\x1f\x8b' else ".nii"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        data = nib.load(tmp_path).get_fdata()
    finally:
        os.remove(tmp_path)

    return data

# ========================================================================================================================

# ----------- Flowise API -----------
@app.post("/flowise")
async def ask_flowise(req: Request):
    print("📨 Flowise request received")
    if not FLOWISE_API_URL:
        return {"error": "FLOWISE_API_URL is not set in environment variables"}
    try:
        data = await req.json()
        prompt = data.get("prompt")
        print("📨 Flowise prompt received:", prompt)
        if not prompt or not prompt.strip():
            return {"error": "No prompt provided"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("📨 Sending request to Flowise API:", FLOWISE_API_URL)
            response = await client.post(FLOWISE_API_URL, json={"question": prompt})
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


import tempfile
import os

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

            processed = preprocess_nifti(flair_bytes, t1ce_bytes)
            raw_prediction = model.predict(processed)

            max_probs = np.max(raw_prediction, axis=-1)
            class_indices = np.argmax(raw_prediction, axis=-1)
            mask = np.zeros_like(class_indices, dtype=np.uint8)
            mask[max_probs >= 0.5] = class_indices[max_probs >= 0.5]

            print("process 2")

            unique_labels = np.unique(mask)
            predicted_labels = [SEGMENT_CLASSES[i] for i in unique_labels if i in SEGMENT_CLASSES]

            seg_img = nib.Nifti1Image(mask, affine=np.eye(4))

            # ✅ Save all 3 NIfTI files
            case_id = str(uuid.uuid4())

            flair_filename = f"flair_{case_id}.nii"
            t1ce_filename = f"t1ce_{case_id}.nii"
            seg_filename   = f"seg_{case_id}.nii"

            flair_path = f"static/files/{flair_filename}"
            t1ce_path  = f"static/files/{t1ce_filename}"
            seg_path   = f"static/files/{seg_filename}"

            with open(flair_path, "wb") as f:
                f.write(flair_bytes)
            with open(t1ce_path, "wb") as f:
                f.write(t1ce_bytes)

            seg_img = nib.Nifti1Image(mask, affine=np.eye(4))
            nib.save(seg_img, seg_path)

            print("process 3")

            return {
                "reply": f"🧠 3D segmentation complete with labels: {', '.join(predicted_labels)}",
                "image_urls": [
                    f"http://localhost:8000/files/{flair_filename}",
                    f"http://localhost:8000/files/{t1ce_filename}",
                    f"http://localhost:8000/files/{seg_filename}"
                ],
                "predicted_labels": predicted_labels
            }

        elif selectedDimension == "2D":
            flair_file = flairFiles[0] if flairFiles else None
            if not flair_file:
                raise HTTPException(status_code=400, detail="Missing 2D image file")

            # Save uploaded image
            filename = f"2d_input_{uuid.uuid4().hex}_{flair_file.filename}"
            save_dir = "static/files"
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
            out_mask = os.path.join(save_dir, "output_mask.png")
            out_overlay = os.path.join(save_dir, "overlay.png")
            input_img_path = os.path.join(save_dir, "input_image.png")

            cv2.imwrite(out_mask, mask_vis)
            cv2.imwrite(out_overlay, overlay)
            cv2.imwrite(input_img_path, original_img)

            # --- Handle optional mask upload ---
            mask_file = None
            mask_array = None
            mask_input_url = None
            # You can add maskFiles: Optional[List[UploadFile]] = File(None) in your endpoint params
            # Here is an example assuming you get mask file as separate UploadFile (adjust accordingly)

            # For example, if you add maskFiles param to your endpoint:
            # mask_file = maskFiles[0] if maskFiles else None

            # Or if mask is submitted alongside flairFiles (adjust to your form)
            # For demo, let's assume mask_file is received somehow:
            # mask_file = maskFiles[0] if maskFiles else None

            if mask_file:
                try:
                    mask_bytes = await mask_file.read()
                    mask_filename = mask_file.filename.lower()

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

            base_url = "http://localhost:8000/files"
            return {
                "reply": "✅ 2D brain segmentation complete.",
                "image_urls": [
                    f"{base_url}/input_image.png",
                    f"{base_url}/output_mask.png",
                    f"{base_url}/overlay.png",
                ],
                "original_mask_url": mask_input_url,
                "metrics": metrics,
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})