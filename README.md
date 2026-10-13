How it works

Uses your phone’s camera (or lets you upload a photo you already took).
Detects and counts the five gem types by color using computer vision (OpenCV.js in the browser).
Calculates points: Orange = 5, Green = 10, Blue = 15, Red = 20, Diamond = 100.
Draws boxes around detected gems so you can see what it found.
Includes simple sliders to adjust minimum gem size and color sensitivity if the lighting or gem colors need a little tuning.

How to use it on your Pixel 10

Download the gem_counter.html file above.
Easiest reliable method for camera access: Upload the file to a free static host (Netlify Drop, GitHub Pages, Surge, etc.) so you get an https:// link. Then open that link in Chrome on your phone. Camera works best over HTTPS.
Alternative (no hosting): Take photos with your normal camera app, then use the “upload” option inside the page (this works even if you just open the file locally).
Once open:
Tap Start Camera (allow permission and prefer the rear camera).
Point at the inside of the treasure box with decent lighting.
Spread the gems a bit so they don’t heavily overlap.
Tap Capture & Count.

Review the counts and total. Use the fine-tune sliders and re-count if needed. You can also retry with a new photo.

Important notes / limitations

This is a solid starting prototype, not perfect. Overlapping gems, strong shadows, unusual lighting, or very specific gem shades can throw the count off. The sliders help, and you can always verify a few by hand.
Diamonds are the trickiest (they’re often clear/sparkly). The current range looks for bright, low-saturation areas — you may need to adjust sensitivity or the color ranges in the code if your diamonds don’t match.
First load downloads OpenCV.js (a few MB), so it needs internet the first time.
For a more permanent “app-like” experience later, you can add a simple manifest and turn it into a Progressive Web App (installable to the home screen).

If the colors of your specific gems don’t match the defaults well, tell me roughly what they look like (or send a sample photo description) and I can tweak the HSV ranges. You can also open the HTML in any text editor and adjust the color thresholds in the colors array.
