import os
import cv2
import numpy as np
import nibabel as nib
from pdf2image import convert_from_path
from PIL import Image
import uuid

def normalize_image(img):
    """Normalize image to 0-255 uint8."""
    img = np.nan_to_num(img)
    img = (img - np.min(img)) / (np.max(img) - np.min(img) + 1e-8)
    return (img * 255).astype(np.uint8)

def convert_nifti_to_jpg(nifti_path, output_dir="temp_slices", slice_index=None):
    """Convert NIfTI file to a JPG slice image."""
    os.makedirs(output_dir, exist_ok=True)
    img_obj = nib.load(nifti_path)
    img_data = img_obj.get_fdata()

    if slice_index is None:
        slice_index = img_data.shape[2] // 2  # Middle slice

    slice_img = img_data[:, :, slice_index]
    norm_slice = normalize_image(slice_img)

    # Convert grayscale → RGB
    norm_rgb = cv2.cvtColor(norm_slice, cv2.COLOR_GRAY2BGR)

    out_path = os.path.join(output_dir, f"slice_{uuid.uuid4().hex}.jpg")
    cv2.imwrite(out_path, norm_rgb)
    return out_path

def convert_pdf_to_jpg(pdf_path, output_dir="temp_pdf", page_index=0):
    """Convert PDF page to JPG image."""
    os.makedirs(output_dir, exist_ok=True)
    images = convert_from_path(pdf_path)
    if page_index >= len(images):
        raise IndexError(f"PDF has only {len(images)} pages.")
    img = images[page_index]
    out_path = os.path.join(output_dir, f"page_{uuid.uuid4().hex}.jpg")
    img.save(out_path, "JPEG")
    return out_path

def convert_npy_to_jpg(npy_path, output_dir="temp_npy"):
    """Convert 2D or 3D npy image to JPG."""
    os.makedirs(output_dir, exist_ok=True)
    img = np.load(npy_path)

    if img.ndim == 2:
        img = np.stack([img] * 3, axis=-1)
    elif img.ndim == 3 and img.shape[2] == 1:
        img = np.repeat(img, 3, axis=-1)
    elif img.ndim == 3 and img.shape[2] == 3:
        pass
    else:
        raise ValueError(f"Unsupported npy shape: {img.shape}")

    img = normalize_image(img)
    out_path = os.path.join(output_dir, f"npy_{uuid.uuid4().hex}.jpg")
    cv2.imwrite(out_path, img)
    return out_path

def load_image_from_any_format(image_path, slice_index=None):
    """
    Convert supported image format into .jpg and return new path:
    - .nii, .nii.gz → middle slice
    - .pdf → page 0
    - .npy → jpg
    - .png/.jpg/.jpeg → return path as-is
    """
    ext = os.path.splitext(image_path)[1].lower()

    if ext in [".nii", ".nii.gz"]:
        return convert_nifti_to_jpg(image_path, slice_index=slice_index)
    elif ext == ".pdf":
        return convert_pdf_to_jpg(image_path)
    elif ext == ".npy":
        return convert_npy_to_jpg(image_path)
    elif ext in [".jpg", ".jpeg", ".png"]:
        return image_path
    else:
        raise ValueError(f"Unsupported image format: {ext}")
