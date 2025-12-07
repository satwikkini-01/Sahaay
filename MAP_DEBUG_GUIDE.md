# Map Not Showing Points - Debug Checklist

## Steps to Debug

### 1. Open Browser Developer Tools
- Press **F12** or **Ctrl+Shift+I**
- Go to **Console** tab
- Refresh the page (F5)

### 2. Check Console Logs
You should see these messages:
```
🗺️ Fetching hotspots from: /api/complaints/hotspots?clustering=true
✅ Hotspots data received: {features: 41, clusters: X, ...}
📍 Map center calculated: {center: [12.29, 76.62], totalPoints: 41}
```

### 3. If You See Errors

**Error: "Cannot read property 'features' of undefined"**
→ API not responding. Check backend is running on port 5000

**Error: "Network Error" or "401 Unauthorized"**
→ Login issue. Try logging in first at http://localhost:3000/login

**Error: No errors but "totalPoints: 0"**
→ Database empty. Run: `node scripts/seedMysoreData.js`

### 4. Check Network Tab
- Go to **Network** tab in DevTools
- Refresh page
- Look for request to `/api/complaints/hotspots`
- Click on it → Preview tab
- Should show JSON with 41 features

### 5. Check Map Container
- In Console tab, run:
```javascript
document.querySelector('.leaflet-container')
```
- Should return an element (not null)
- If null → Map not rendering at all

### 6. Verify Backend API
Open new terminal and run:
```bash
curl http://localhost:5000/api/complaints/hotspots | ConvertFrom-Json | Select-Object -ExpandProperty features | Measure-Object
```
Should show: Count: 41

## Quick Fixes

### If Frontend Won't Update
```bash
# Stop frontend (Ctrl+C)
# Delete .next folder
rm -r .next
# Restart
npm run dev
```

### If Map Still Empty
Check if you're on the right page:
- URL should be: http://localhost:3000
- Scroll down to "Real-Time Geospatial Intelligence" section
- Map should be visible (not the login or dashboard page)

### If Nothing Works
1. Stop both servers
2. Clear browser cache (Ctrl+Shift+Delete)
3. Delete .next folder in frontend
4. Restart both backend and frontend
5. Navigate to http://localhost:3000
6. Check console for errors
