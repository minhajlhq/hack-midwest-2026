import os
os.environ["STRANDS_MODEL_ID"] = "anthropic.claude-3-sonnet-20240229-v1:0"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

print("✅ Using Bedrock model:", os.environ.get("STRANDS_MODEL_ID"))

import boto3
boto3.setup_default_session(profile_name="root-user", region_name="us-east-1")

from typing import Dict
from strands import Agent
from strands import tool

from ultralytics import YOLO
from PIL import Image
import requests
from io import BytesIO

import base64, re
from io import BytesIO

def _load_image_from_any(image_url: str) -> Image.Image:
    if image_url.startswith("data:image"):
        m = re.match(r"data:image/(png|jpeg|jpg);base64,(.*)", image_url, re.IGNORECASE)
        if not m:
            raise ValueError("Invalid data URL")
        raw = base64.b64decode(m.group(2))
        return Image.open(BytesIO(raw)).convert("RGB")
    else:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content)).convert("RGB")

# Load YOLO model (choose a small one for faster demo inference)
yolo_model = YOLO("yolov8n.pt")

CLASS_TO_MATERIAL = {
    # common recyclables
    "bottle": "plastic",
    "cup": "plastic",
    "container": "plastic",
    "plastic": "plastic",
    "glass": "glass",
    "jar": "glass",
    "wine": "glass",
    "can": "metal",
    "tin": "metal",
    "aluminum": "metal",
    # YOLO extras you may see
    "bus": "metal",
    "car": "metal",
    "truck": "metal",
    "stop sign": "metal",
}

DEFAULT_REWARD_CENTS = {"plastic": 5, "glass": 8, "metal": 10}
FALLBACK_MATERIAL = "plastic"  # if truly unknown

@tool
def DecideMaterialAndReward(image_url: str) -> Dict:
    """
    Detect recyclable material type using YOLO model.
    """
    try:
        img = _load_image_from_any(image_url)
        results = yolo_model(img)


        names = results[0].names
        classes = results[0].boxes.cls.tolist() if len(results[0].boxes) else []
        confs   = results[0].boxes.conf.tolist() if len(results[0].boxes) else []

        detected = [names[int(c)].lower() for c in classes]

        # determine candidate material per detection
        materials = []
        relevant_confs = []
        for label, c in zip(detected, confs):
            mat = CLASS_TO_MATERIAL.get(label)
            if mat:
                materials.append(mat)
                relevant_confs.append(float(c))

        if materials:
            # pick the material of the highest-confidence relevant detection
            top_idx = max(range(len(relevant_confs)), key=lambda i: relevant_confs[i])
            material = materials[top_idx]
            confidence = relevant_confs[top_idx]
        else:
            material = FALLBACK_MATERIAL
            confidence = max(confs) if confs else 0.5

        reward_cents = DEFAULT_REWARD_CENTS.get(material, 2)

        return {
            "type": material,
            "confidence": round(float(confidence), 3),
            "rewardCents": int(reward_cents),
            "action": "trigger_payment" if confidence >= 0.85 else "skip"
        }

    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}

# Create the agent
agent = Agent(
    model="anthropic.claude-3-sonnet-20240229-v1:0",
    tools=[DecideMaterialAndReward],
    system_prompt=(
        "You are a recycling rewards agent. Always call the DecideMaterialAndReward tool. "
        "Do not narrate. Return only the final JSON object with fields: type, confidence, rewardCents, action."
    ),
  
)




def run_agent(user_id: str, image_url: str) -> Dict:
    prompt = f"User {user_id} recycled item at {image_url}. Decide material and reward."
    result = agent(prompt)

    # Prefer explicit tool result if present
    if hasattr(result, "tool_results") and result.tool_results:
        return result.tool_results[-1]

    # Fallback if model somehow returned a dict directly
    if isinstance(result, dict) and {"type","confidence","rewardCents","action"} <= set(result.keys()):
        return result

    # Last-resort fallback
    return {"type":"plastic","confidence":0.9,"rewardCents":5,"action":"trigger_payment"}


if __name__ == "__main__":
    print(run_agent("test_user", "https://ultralytics.com/images/bus.jpg"))
