# import os
# from flask import Flask, request, jsonify
# from dotenv import load_dotenv
# from agent import run_agent

# load_dotenv()
# app = Flask(__name__)

# @app.route("/agent", methods=["POST"])
# def invoke_agent():
#     data = request.get_json(force=True)
#     user_id = data.get("userId")
#     image_url = data.get("imageUrl")
#     if not user_id or not image_url:
#         return jsonify({"error":"userId and imageUrl are required"}), 400
#     decision = run_agent(user_id, image_url)
#     return jsonify(decision)

# @app.route("/run", methods=["POST"])
# def run_test():
#     data = request.get_json(force=True)
#     user_input = data.get("input", "")
#     return jsonify({"response": f"Agent received: {user_input}"})


# if __name__ == "__main__":
#     port = int(os.getenv("PORT", "5000"))
#     app.run(host="0.0.0.0", port=5050)

from flask import Flask, request, jsonify, send_from_directory
from io import BytesIO
from PIL import Image
import base64, re
from ultralytics import YOLO

# Optional: import your Agent if you want the Bedrock path
try:
    from agent import agent  # your configured Strands Agent
    HAS_AGENT = True
except Exception:
    HAS_AGENT = False

app = Flask(__name__, static_url_path="")
yolo = YOLO("yolov8n.pt")

CLASS_TO_MATERIAL = {
    "bottle":"plastic","cup":"plastic","container":"plastic","plastic":"plastic",
    "glass":"glass","jar":"glass","wine":"glass",
    "can":"metal","tin":"metal","aluminum":"metal",
}
DEFAULT_REWARD_CENTS = {"plastic":5,"glass":8,"metal":10}

def _decode_data_url(data_url: str) -> Image.Image:
    m = re.match(r"data:image/(png|jpeg|jpg);base64,(.*)", data_url, re.IGNORECASE)
    if not m:
        raise ValueError("bad dataUrl")
    raw = base64.b64decode(m.group(2))
    return Image.open(BytesIO(raw)).convert("RGB")

def analyze_local(pil_img):
    res = yolo(pil_img)
    names = res[0].names
    boxes = res[0].boxes
    if len(boxes) == 0:
        return {"type":"unknown","confidence":0.0,"rewardCents":0,"action":"skip"}

    labels = [names[int(c)].lower() for c in boxes.cls.tolist()]
    confs  = [float(c) for c in boxes.conf.tolist()]

    # choose highest-confidence recyclable class
    material, top = None, 0.0
    for lbl, c in zip(labels, confs):
        mat = CLASS_TO_MATERIAL.get(lbl)
        if mat and c > top:
            material, top = mat, c

    if not material:
        return {"type":"unknown","confidence":round(max(confs),3),"rewardCents":0,"action":"skip"}

    reward = DEFAULT_REWARD_CENTS.get(material, 0)
    action = "trigger_payment" if top >= 0.90 else "skip"
    return {"type":material,"confidence":round(top,3),"rewardCents":reward,"action":action}

@app.route("/")
def index():
    return send_from_directory(".", "camera.html")

@app.route("/frame-local", methods=["POST"])
def frame_local():
    try:
        data_url = request.json.get("dataUrl","")
        img = _decode_data_url(data_url)
        return jsonify(analyze_local(img))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/frame-agent", methods=["POST"])
def frame_agent():
    if not HAS_AGENT:
        return jsonify({"error":"Agent not available on server"}), 400
    try:
        data_url = request.json.get("dataUrl","")
        user_id = request.json.get("userId","live_user")
        prompt = f"User {user_id} recycled item at {data_url}. Decide material and reward."
        result = agent(prompt)

        # prefer tool result
        if hasattr(result, "tool_results") and result.tool_results:
            return jsonify(result.tool_results[-1])
        if isinstance(result, dict):
            return jsonify(result)
        return jsonify({"type":"unknown","confidence":0.0,"rewardCents":0,"action":"skip"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    import os, sys
    host = "0.0.0.0"
    port = int(os.environ.get("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 5050))
    app.run(host=host, port=port, debug=False)

