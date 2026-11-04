# KRC Gem Tracker v6.3 – Setup Guide

## 1. Update the Google Sheet script (do this first – needed for Add Kid)
1. Open the **KRC Gem Tracker** sheet > Extensions > Apps Script.
2. **Copy your current SECRET word** from the line `var SECRET = '...'`.
3. Select everything in Code.gs, delete it, and paste in `KRC_GemTracker_AppsScript_v6_3.gs`.
4. Put your SECRET word back into `var SECRET = '...'`. Click Save.
5. Deploy > **Manage deployments** > pencil (Edit) > Version: **New version** > Deploy.
   (Don't pick "New deployment" – that makes a new URL and the app would need the new link.)

## 2. Upload to GitHub Pages
1. Go to github.com/nelumh/GemTracker > Add file > Upload files.
2. Drag in **everything** in this folder: `index.html`, `manifest.json`, `sw.js`, `opencv.js`, and the `icons` folder.
   (`index.html` replaces the old page. The .gs file and this guide don't need to be uploaded.)
3. Commit. Wait 1–2 minutes, then open https://nelumh.github.io/GemTracker/

## 3. Install on the tablet
- **Android (Verizon tablet), Chrome:** open the link > ⋮ menu > **Add to Home screen / Install app**.
- **iPad, Safari:** open the link > Share button > **Add to Home Screen**.
- Open it from the new icon. First time: tap ⚙️ Settings, enter the Key, your name, Save. Allow the camera when asked.
- Your old kid list and waiting saves move over automatically.

## 4. Test offline mode
1. Open the app once with Wi-Fi on and wait about 30 seconds (it downloads its offline copy).
2. Turn on Airplane mode. Close the app and reopen it from the icon.
3. Add a test kid, count gems, Add XP. The status line will say "offline" and "1 waiting to upload".

## 5. Sync (backup to the Google Sheet)
- It syncs on its own when the internet comes back, and checks every minute.
- Or tap **🔄 Sync now**. "Last synced" shows the last time everything was saved to the sheet.
- New kids show up in the sheet's Kids tab with an ID like P52.
- Each save has its own ID, so retries or imports never count it twice.

## 6. Backup file (no internet needed)
- **💾 Export backup** saves a .json file to Downloads. The Key is not included.
- **📂 Import backup** loads one back, for example onto a new tablet. Saves it already has are skipped.

## Updating later
After you change files, edit `sw.js` and change `krc-gem-v6.3-1` to `-2`, so tablets get the new version.
