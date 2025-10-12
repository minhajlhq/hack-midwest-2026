# 🎥 Ring Camera Testing Guide

## Quick Start - Test Your Ring Footage Now!

### Step 1: Start Both Servers

**Terminal 1 - Backend API:**

```bash
cd /Users/talhanaseer/hack-midwest-2026/workspace
eval "$(fnm env --use-on-cd)"
fnm use 22
npx nx serve api
```

**Terminal 2 - Frontend:**

```bash
cd /Users/talhanaseer/hack-midwest-2026/workspace
eval "$(fnm env --use-on-cd)"
fnm use 22
npx nx serve web-app
```

### Step 2: Open the Scanner

Navigate to: **http://localhost:4200/scanner**

### Step 3: Access Your Ring Footage

#### Option A: Using Ring Dashboard (Recommended for Testing)

1. **Click the "Open Ring Dashboard →" button** on the scanner page
   - This opens ring.com in a new tab
2. **Log into your Ring account**

   - Username/email and password
   - Complete any 2FA if required

3. **Navigate to Live View**

   - Click on your Ring camera
   - Click "Live View" to see real-time footage

4. **Capture Your Ring Footage**

   - **On Mac:** Press `⌘+Shift+4` (crosshair appears, drag to select area)
   - **On Windows:** Press `Win+Shift+S` (snipping tool opens)
   - Select just the video feed area from your Ring dashboard

5. **Upload to Scanner**
   - Go back to http://localhost:4200/scanner
   - Click "📁 Upload Image"
   - Select your screenshot
   - Watch the AI detect and classify objects!

#### Option B: Use Webcam (Quick Test Without Ring)

1. On the scanner page, click **"📷 Use Webcam"**
2. Allow camera permissions when prompted
3. Place a recyclable item in front of your webcam
4. Click **"📸 Capture & Scan"**
5. View detection results and SBC rewards!

## 🎯 What to Test

### Test Scenarios

1. **Single Item Detection**

   - Place one bottle in front of Ring camera
   - Screenshot and upload
   - Should detect: "bottle" → 5 SBC reward

2. **Multiple Items**

   - Place bottle + can in front of camera
   - Screenshot and upload
   - Should detect both → Combined SBC rewards

3. **E-Waste**

   - Show laptop, phone, or keyboard to camera
   - Higher SBC rewards (30-50 SBC)

4. **Non-Recyclables**
   - Show food or plastic bags
   - Should detect but show 0 SBC (non-recyclable)

### Expected Behavior

✅ **What Should Work:**

- Image uploads (JPEG, PNG, etc.)
- Webcam capture and scanning
- Object detection (mock data currently)
- SBC reward calculation
- Detection results display with confidence scores
- Recyclability classification

⚠️ **Current Limitations:**

- Detection uses mock data for demo (YOLOv8 not yet integrated)
- Ring API not directly connected (screenshot method only)
- No persistent storage of scans/rewards yet

## 📊 Understanding the Results

### Detection Display

Each detected item shows:

- **Object Name** - What was detected (e.g., "bottle", "can")
- **Confidence** - Detection accuracy (75-99%)
- **Material** - Type of material (Plastic, Aluminum, E-Waste, etc.)
- **Category** - Broad classification (Container, Electronics, Paper)
- **Recyclable Status** - ✅ Recyclable or ❌ Non-Recyclable
- **SBC Reward** - Tokens earned (0-50 SBC)

### SBC Reward Breakdown

| Item Type          | SBC Range | Examples              |
| ------------------ | --------- | --------------------- |
| **High Value**     | 30-50 SBC | Laptop, Phone, TV     |
| **Medium Value**   | 8-15 SBC  | Cans, Keyboard, Mouse |
| **Low Value**      | 2-5 SBC   | Bottles, Cups, Paper  |
| **Non-Recyclable** | 0 SBC     | Food, Plastic bags    |

## 🐛 Troubleshooting

### "Failed to process image" Error

**Solution:**

- Check that backend is running on port 3000
- The app will fallback to mock detection for demo
- Look for "(Demo Mode)" in the status message

### Can't Access Ring Dashboard

**Solution:**

- Make sure you're logged into ring.com
- Try opening ring.com manually in a separate tab
- Check your Ring account credentials

### Webcam Not Working

**Solutions:**

- Grant camera permissions when browser prompts
- Check System Preferences → Privacy → Camera (Mac)
- Try using Chrome or Firefox
- Use screenshot upload method instead

### No Detection Results

**Solution:**

- Currently using mock detection (this is normal!)
- Results are randomly generated for demo
- Real YOLOv8 integration coming next

### Screenshot is Blurry

**Solutions:**

- Make sure Ring Live View is in HD mode
- Get closer to the items
- Ensure good lighting in camera view
- Clean your Ring camera lens

## 📸 Screenshot Tips for Best Results

### Capturing Ring Footage

1. **Use Ring's HD Mode**

   - Enable HD streaming in Ring settings
   - Better image quality = better detection

2. **Proper Framing**

   - Center the item in Ring's view
   - Fill 30-50% of the frame with the object
   - Leave some background space

3. **Lighting**

   - Ring's night vision can work but daylight is better
   - Avoid backlighting (don't place items in front of bright windows)
   - Turn on outdoor lights if needed

4. **Clean Background**

   - Place items on neutral surface when possible
   - Avoid cluttered backgrounds
   - Solid colors work best (concrete, wood, etc.)

5. **Item Positioning**
   - Lay items flat or stand upright
   - Make sure full item is visible
   - No overlapping items (for now)

## 🚀 Next Steps After Testing

### 1. Review Detection Results

- Do the detected objects match what you showed?
- Are the SBC rewards appropriate?
- Is the confidence level reasonable?

### 2. Test Different Items

- Try various recyclables from the database
- Test non-recyclable items
- Mix different materials

### 3. Provide Feedback

Note any issues:

- Incorrect detections
- UI/UX improvements needed
- Feature requests

### 4. Production Enhancements

Once testing is complete:

- Integrate real YOLOv8 model
- Connect to Ring API directly
- Add user authentication
- Store detection history
- Process actual SBC payments

## 🎨 UI Features to Test

### Navigation

- ✅ Click "Scanner" in main nav
- ✅ "Start Scanning" button from homepage
- ✅ All pages have consistent header/footer

### Instructions Panel

- ✅ Click "▶ View Instructions" to expand
- ✅ Click "▼ Hide Details" to collapse
- ✅ Links to Ring dashboard work

### Upload Methods

- ✅ "📁 Upload Image" file selector
- ✅ "📷 Use Webcam" starts camera
- ✅ "📸 Capture & Scan" takes photo
- ✅ "⏹️ Stop Webcam" stops camera

### Results Display

- ✅ Total SBC shown prominently
- ✅ Individual item cards with details
- ✅ Green for recyclable, red for non-recyclable
- ✅ Status messages update correctly

## 💡 Demo Script for Presentations

### 1. Opening (30 seconds)

"This is Trash2Cash - we turn recycling into instant rewards using AI and blockchain."

### 2. Show Ring Integration (1 minute)

1. Navigate to scanner page
2. Click "Open Ring Dashboard"
3. Show Ring Live View (or screenshot)
4. Explain: "Ring cameras monitor collection points"

### 3. Demo Detection (2 minutes)

1. Upload Ring screenshot OR use webcam
2. Click scan/capture
3. Point out:
   - AI detecting objects with YOLOv8
   - Material identification
   - Recyclability classification
   - SBC reward calculation

### 4. Show Results (1 minute)

1. Walk through detection cards
2. Highlight total SBC earned
3. Explain different reward levels
4. Point out confidence scores

### 5. Close with Vision (30 seconds)

"Next: Real-time Ring API integration, instant Solana payments, and deployed at recycling centers."

## 📞 Support & Resources

### Files to Reference

- **Setup Guide:** `RECYCLING_SCANNER_SETUP.md`
- **Component:** `apps/web-app/src/app/RecyclingScanner.tsx`
- **Backend:** `apps/api/src/app/detection/`

### Testing Checklist

- [ ] Both servers running
- [ ] Scanner page loads
- [ ] Ring dashboard link works
- [ ] Image upload works
- [ ] Webcam capture works
- [ ] Detection results display
- [ ] SBC rewards calculate correctly
- [ ] All UI elements responsive

### Success Criteria

✅ Can access Ring footage
✅ Can upload screenshots  
✅ Can see detection results
✅ SBC rewards displayed
✅ UI is intuitive and responsive
✅ Ready to integrate real YOLOv8

---

## 🎉 Ready to Test!

You now have everything you need to test the Ring camera integration. Start with the screenshot method, verify the UI works, and you'll be ready to integrate real YOLOv8 detection!

**Quick Start Command:**

```bash
# Run both in separate terminals
npx nx serve api     # Terminal 1
npx nx serve web-app # Terminal 2
# Then open http://localhost:4200/scanner
```

Happy Testing! ♻️💰

