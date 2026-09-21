# Flamingo — Image & Video Tools for AI

One page, two tools: inspect a single image, or build a labeled dataset
from photos and video for training a model. Everything runs locally in
the browser — nothing is ever uploaded anywhere.

## Project structure
```
.
├── index.html          # Web app — open this in any browser
├── style.css             # Clean, light theme, single accent color
├── script.js              # Both tools' logic
├── netlify.toml           # Deploy config for Netlify
├── image_tool.py          # Python core functions (single-image CLI version)
├── main.py                # Python interactive command-line menu
├── requirements.txt       # Python dependencies
└── README.md
```

## Tool 1: Image Inspector
The original six-step tool, for working with one image at a time.
1. **Load** — drop an image in or tap to browse.
2. **Display** — it renders on a canvas right away.
3. **Dimensions** — width, height, file size, and format are shown.
4. **Grayscale** — convert in place; reset to the original any time.
5. **Resize** — set a new width/height (aspect ratio locks by default).
6. **Numeric array** — view the image as its raw pixel values and download
   them as JSON.
7. **Save** — download the processed image.

## Tool 2: Dataset Builder
For preparing many images — and video — as a single labeled dataset.
1. **Define classes** — add the categories your model should learn (e.g.
   `cat`, `dog`).
2. **Import & label** — drop in images and/or videos. Videos are
   automatically split into individual frames at the interval you set
   (default: 1 frame per second, capped at 90 frames per video), and each
   frame joins the gallery as its own labeled image. Assign a class to
   every item from its dropdown.
3. **Preprocessing** — set the output width/height every item will be
   resized to, choose color or grayscale, and whether pixel values are
   normalized to 0–1 (standard for training) or left as raw 0–255.
4. **Split & export** — set the train/test split and whether to shuffle,
   then tap **Export dataset (JSON)**.

The exported file looks like this:
```json
{
  "classes": ["cat", "dog"],
  "image_shape": [64, 64, 3],
  "normalized": true,
  "train": [ { "label": "cat", "data": [[[0.12, 0.10, 0.09], ...], ...] } ],
  "test":  [ { "label": "dog", "data": [[[0.44, 0.41, 0.39], ...], ...] } ]
}
```
`data` is a nested array of shape `[height][width][channels]` — load it
with `json.load()` in Python and pass it into `numpy.array()` or a
framework like TensorFlow/PyTorch to start training.

> Video support works by sampling frames and treating each one as a
> training image — the same approach lightweight video classifiers use in
> practice (classify frames, then aggregate). It does not train a model
> that understands motion between frames; that needs a different kind of
> architecture and more compute than a browser tool can offer.

## Hosting

### GitHub Pages
1. In your repo, go to **Settings → Pages**.
2. Set the source to the `main` branch, root folder.
3. Save. GitHub gives you a live link you can open on any device.

### Netlify
`netlify.toml` is already set up (no build step, publishes the repo root).
Connect the repo in Netlify and it deploys automatically.

## Python CLI version
A simpler, single-image utility — handy for quick one-off checks from a
terminal rather than the browser.
```bash
pip install -r requirements.txt
python main.py
```

## Uploading to GitHub from mobile
1. Create a new repository in the GitHub app (or github.com in your browser).
2. Use "Add file → Upload files" and upload all the files above, keeping
   their names exactly as they are.
3. Commit directly to the `main` branch. 
