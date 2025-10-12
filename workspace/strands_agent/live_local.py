import cv2
from ultralytics import YOLO
from PIL import Image
import numpy as np

# ---- mapping & rewards ----
CLASS_TO_MATERIAL = {
    "bottle":"plastic","cup":"plastic","container":"plastic","plastic":"plastic",
    "glass":"glass","jar":"glass","wine":"glass",
    "can":"metal","tin":"metal","aluminum":"metal",
    "bus":"metal","car":"metal","truck":"metal","stop sign":"metal",
}
DEFAULT_REWARD_CENTS = {"plastic":5,"glass":8,"metal":10}
CONF_THRESH = 0.50
TRIGGER_THRESH = 0.90

yolo = YOLO("yolov8n.pt")

def decide_from_frame(frame_bgr):
    img_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    results = yolo(pil_img)

    if not len(results[0].boxes):
        return {"type":"unknown","confidence":0.0,"rewardCents":0,"action":"skip"}, results

    names = results[0].names
    labels = [names[int(c)].lower() for c in results[0].boxes.cls.tolist()]
    confs  = [float(c) for c in results[0].boxes.conf.tolist()]

    material, top_conf = None, 0.0
    for lbl, c in zip(labels, confs):
        if c < CONF_THRESH: 
            continue
        mat = CLASS_TO_MATERIAL.get(lbl)
        if mat and c > top_conf:
            material, top_conf = mat, c

    if not material:
        return {"type":"unknown","confidence":round(max(confs),3),"rewardCents":0,"action":"skip"}, results

    reward = DEFAULT_REWARD_CENTS.get(material, 0)
    action = "trigger_payment" if top_conf >= TRIGGER_THRESH else "skip"
    return {"type":material,"confidence":round(top_conf,3),"rewardCents":reward,"action":action}, results

def draw_overlay(frame, results, decision):
    if len(results[0].boxes):
        for box, c in zip(results[0].boxes.xyxy.cpu().numpy(), results[0].boxes.conf.cpu().numpy()):
            x1,y1,x2,y2 = map(int, box)
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, f"{c:.2f}", (x1, max(15,y1-6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)
    text = f"{decision['type']} | conf={decision['confidence']:.2f} | reward={decision['rewardCents']}¢ | {decision['action']}"
    cv2.rectangle(frame, (0,0), (frame.shape[1], 30), (0,0,0), -1)
    cv2.putText(frame, text, (10,22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)
    return frame

def open_rtsp(url):
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open RTSP source: {url}")
    return cap

def main(rtsp_url):
    cap = open_rtsp(rtsp_url)
    while True:
        ok, frame = cap.read()
        if not ok:
            # try a quick reconnect
            cap.release()
            cap = open_rtsp(rtsp_url)
            continue

        decision, results = decide_from_frame(frame)
        frame = draw_overlay(frame, results, decision)
        cv2.imshow("Recycling Rewards (RTSP Local)", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # Replace with your phone’s RTSP URL
    main("rtsp://192.168.1.64:8554/stream")
