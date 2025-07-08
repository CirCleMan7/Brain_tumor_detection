# ==== [unet_predict.py] ====
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

MODEL_PATH = "./Unet2D_110e_class3_new.h5"
IMG_SIZE = (256, 256)
NUM_CLASSES = 4
CLASS_COLORS = {
    1: (255, 0, 0),
    2: (0, 255, 0),
    3: (0, 0, 255),
}

def dice_coef(y_true, y_pred, smooth=1e-7):
    y_true_f = tf.keras.backend.flatten(y_true)
    y_pred_f = tf.keras.backend.flatten(y_pred)
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth)

model = load_model(MODEL_PATH, custom_objects={"dice_coef": dice_coef}, compile=False)

def load_image(path):
    if path.endswith(".npy"):
        img = np.load(path)
    else:
        img = cv2.imread(path, cv2.IMREAD_COLOR)

    if img.ndim == 2:
        img = np.stack([img] * 3, axis=-1)
    elif img.shape[-1] == 1:
        img = np.repeat(img, 3, axis=-1)

    img = cv2.resize(img, IMG_SIZE)
    img_input = img.astype(np.float32) / 255.0
    img_input = np.expand_dims(img_input, axis=0)
    return img_input, img

def predict_image(path):
    img_input, original_img = load_image(path)
    pred = model.predict(img_input)[0]
    pred_mask = np.argmax(pred, axis=-1).astype(np.uint8)
    return pred_mask, original_img

def create_overlay(image, pred_mask):
    if image.ndim == 2:
        image = np.stack([image] * 3, axis=-1)
    elif image.ndim == 3 and image.shape[-1] == 1:
        image = np.repeat(image, 3, axis=-1)

    overlay = image.copy()
    for cls_id, color in CLASS_COLORS.items():
        mask = (pred_mask == cls_id).astype(np.uint8)
        color_layer = np.zeros_like(image)
        color_layer[mask == 1] = color
        overlay = cv2.addWeighted(overlay, 1.0, color_layer, 0.5, 0)
    return overlay

def load_mask(mask_path):
    abs_path = os.path.abspath(mask_path)
    if not os.path.exists(abs_path):
        raise ValueError(f"Mask file does not exist: {abs_path}")

    ext = os.path.splitext(mask_path)[-1].lower()

    if ext == ".npy":
        mask = np.load(abs_path)
    elif ext in [".png", ".jpg", ".jpeg"]:
        mask = cv2.imread(abs_path, cv2.IMREAD_UNCHANGED)
        if mask is None:
            raise ValueError(f"Unable to read mask image file: {abs_path}")
        if len(mask.shape) == 3:
            mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    else:
        raise ValueError(f"Unsupported mask file type: {ext}")

    mask = cv2.resize(mask, IMG_SIZE)
    return mask.astype(np.uint8)

def evaluate_array(pred_mask, true_mask):
    pred_mask = cv2.resize(pred_mask, IMG_SIZE).astype(np.uint8)
    true_mask = cv2.resize(true_mask, IMG_SIZE).astype(np.uint8)

    y_true_flat = true_mask.flatten()
    y_pred_flat = pred_mask.flatten()

    TP = np.sum((y_true_flat == y_pred_flat) & (y_true_flat != 0))
    TN = np.sum((y_true_flat == 0) & (y_pred_flat == 0))
    FP = np.sum((y_true_flat == 0) & (y_pred_flat != 0))
    FN = np.sum((y_true_flat != 0) & (y_pred_flat == 0))

    accuracy = (TP + TN) / (TP + TN + FP + FN + 1e-7)
    precision = TP / (TP + FP + 1e-7)
    recall = TP / (TP + FN + 1e-7)
    f1 = 2 * precision * recall / (precision + recall + 1e-7)

    class_names = {1: "Necrosis", 2: "Edema", 3: "Enhancing Tumor"}
    per_class_iou = {}
    per_class_dice = []

    for cls in range(1, NUM_CLASSES):
        cls_name = class_names.get(cls, f"Class {cls}")
        cls_true = (true_mask == cls).astype(np.uint8)
        cls_pred = (pred_mask == cls).astype(np.uint8)

        intersection = np.sum(cls_true * cls_pred)
        union = np.sum(cls_true) + np.sum(cls_pred) - intersection
        iou = (intersection + 1e-7) / (union + 1e-7)
        dice = (2 * intersection + 1e-7) / (np.sum(cls_true) + np.sum(cls_pred) + 1e-7)

        per_class_iou[cls_name] = {
            "IoU": float(round(iou, 4)),
            "Dice": float(round(dice, 4))
        }

        per_class_dice.append(dice)

    mean_iou = np.mean([v["IoU"] for v in per_class_iou.values()])
    mean_dice = np.mean(per_class_dice)

    return {
        "Accuracy": float(round(accuracy, 4)),
        "Precision": float(round(precision, 4)),
        "Recall": float(round(recall, 4)),
        "F1 Score": float(round(f1, 4)),
        "IoU": float(round(mean_iou, 4)),
        "Dice Coefficient": float(round(mean_dice, 4)),
        "Per-Class Metrics": per_class_iou
    }

def visualize_mask(mask):
    color_map = {
        0: (0, 0, 0),
        1: (255, 0, 0),
        2: (0, 255, 0),
        3: (0, 0, 255),
    }
    h, w = mask.shape
    vis = np.zeros((h, w, 3), dtype=np.uint8)
    for cls, color in color_map.items():
        vis[mask == cls] = color
    return vis

def get_detected_tumor_types(pred_mask):
    tumor_class_names = {
        1 : "Necrosis",
        2 : "Edema",
        3 : "Enhancing Tumor"
    }

    detected_classes = np.unique(pred_mask)
    found = [tumor_class_names[cls] for cls in detected_classes if cls in tumor_class_names]

    if not found:
        return "not a tumor in this image"
    elif len(found) == 1:
        return f'found {found[0]}'
    else:
        return "found " + ", ".join(found)
    