# live_agent_rtsp.py
import time, cv2, base64
from io import BytesIO
from PIL import Image
from ultralytics import YOLO
from agent import agent  # your configured Strands Agent (Claude 3 Sonnet, tool, etc.)

# ---- Controls (tune cost & sensitivity here) ----
RTSP_URL = "rtsp://192.168.1.64:8554/stream"  # <-- put your phone’s RTSP URL
MIN_INTERVAL_SECS = 3.0     # Bedrock call at most once every N seconds (set 3–5 for demo)
RECYCLE_CONF_MIN  = 0.75    # Only call agent if YOLO sees a recyclable above this conf
RECYCLABLE_LABELS = {
    "bottle","cup","container","plastic","glass","jar","wine","can","tin","aluminum"
}
# --------------------------------------------------

yolo = YOLO("yolov8n.pt")

def frame_to_data_url(frame_bgr):
    pil = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))
    buf = BytesIO()
    pil.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def looks_recyclable(frame_bgr):
    # quick gate using YOLO to avoid unnecessary Bedrock calls
    pil = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))
    res = yolo(pil)
    if not len(res[0].boxes):
        return False
    names = res[0].names
    labels = [names[int(c)].lower() for c in res[0].boxes.cls.tolist()]
    confs  = [float(c) for c in res[0].boxes.conf.tolist()]
    for lbl, c in zip(labels, confs):
        if lbl in RECYCLABLE_LABELS and c >= RECYCLE_CONF_MIN:
            return True
    return False

def open_rtsp(url):
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open RTSP source: {url}")
    return cap

def main(rtsp_url=RTSP_URL, user_id="live_user"):
    cap = open_rtsp(rtsp_url)
    last_call = 0.0
    last_text = "idle"

    while True:
        ok, frame = cap.read()
        if not ok:
            cap.release()
            cap = open_rtsp(rtsp_url)
            continue

        now = time.monotonic()
        should_call = (now - last_call) >= MIN_INTERVAL_SECS and looks_recyclable(frame)

        if should_call:
            data_url = frame_to_data_url(frame)
            prompt = f"User {user_id} recycled item at {data_url}. Decide material and reward."
            result = agent(prompt)

            if hasattr(result, "tool_results") and result.tool_results:
                d = result.tool_results[-1]
            elif isinstance(result, dict):
                d = result
            else:
                d = {"type":"unknown","confidence":0.0,"rewardCents":0,"action":"skip"}

            last_text = f"{d.get('type')} | conf={d.get('confidence')} | {d.get('rewardCents')}¢ | {d.get('action')}"
            last_call = now

        # overlay last decision
        cv2.rectangle(frame, (0,0), (frame.shape[1], 30), (0,0,0), -1)
        cv2.putText(frame, last_text, (10,22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)

        cv2.imshow("Recycling Rewards (RTSP Agent)", frame)
        if (cv2.waitKey(1) & 0xFF) == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

