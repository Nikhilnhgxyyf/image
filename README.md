# Aperture — Image Information and Processing Tool

Load an image, inspect it, convert it to grayscale, resize it, and save the
result. Two versions are included: a browser-based tool with a full UI, and
a Python command-line version.

## Project structure
```
.
├── index.html         # Web app — open this in any browser
├── style.css          # Dark theme, gradient accents
├── script.js          # Load / display / dimensions / grayscale / resize / save
├── image_tool.py       # Python core functions (CLI version)
├── main.py             # Python interactive command-line menu
├── requirements.txt    # Python dependencies
└── README.md
```

## Web app (recommended)
No install required — everything runs locally in the browser, and no file
ever leaves your device.

1. Open `index.html` in any browser (double-tap it, or use GitHub Pages —
   see below).
2. Tap the drop zone to choose an image, or drag one in on desktop.
3. Check its dimensions, size, and format in the details panel.
4. Convert to grayscale and/or resize (aspect ratio locks by default).
5. Tap **Convert to numeric array** to see the pixel values (shape and a
   sample), and optionally download the full array as JSON.
6. Tap **Save processed image** to download the result.

### Hosting it with GitHub Pages
1. In your repo, go to **Settings → Pages**.
2. Under "Build and deployment", set the source to the `main` branch, root
   folder.
3. Save. GitHub gives you a live link (e.g.
   `https://<your-username>.github.io/<repo-name>/`) that you can open on
   any device.

## Python CLI version
```bash
pip install -r requirements.txt
python main.py
```
You'll be prompted for an image path, then shown a menu to display it,
check dimensions, convert to grayscale, resize, and save.

```python
from image_tool import load_image, convert_to_grayscale, resize_image, save_image

img = load_image("photo.jpg")
img = convert_to_grayscale(img)
img = resize_image(img, 300, 300)
save_image(img, "photo_processed.jpg")
```

## Uploading to GitHub from mobile
1. Create a new repository in the GitHub app (or github.com in your browser).
2. Use "Add file → Upload files" and upload all the files above, keeping
   their names exactly as they are (the web app depends on `style.css` and
   `script.js` being next to `index.html`).
3. Commit directly to the `main` branch.
4. 
