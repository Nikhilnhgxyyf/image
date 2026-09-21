# Flamingo — Image Dataset Builder for AI Training

Turn a folder of images into a labeled, preprocessed dataset ready to train
an AI model — entirely in the browser, no upload, no backend.

## Project structure
```
.
├── index.html         # Web app — open this in any browser
├── style.css           # Dark theme, gradient accents
├── script.js            # Classes, labeling, preprocessing, split, export
├── netlify.toml         # Deploy config for Netlify
├── image_tool.py         # Python core functions (single-image CLI version)
├── main.py               # Python interactive command-line menu
├── requirements.txt      # Python dependencies
└── README.md
```

## Web app (recommended)
No install required — everything runs locally, and no image ever leaves
your device.

1. **Define classes** — add the categories your model should learn (e.g.
   `cat`, `dog`).
2. **Import & label images** — drop in as many images as you like, then
   assign each one a class from its dropdown.
3. **Preprocessing** — set the output width/height every image will be
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
with `json.load()` in Python and pass it straight into `numpy.array()` or
a framework like TensorFlow/PyTorch to start training.

### Hosting it with GitHub Pages
1. In your repo, go to **Settings → Pages**.
2. Set the source to the `main` branch, root folder.
3. Save. GitHub gives you a live link you can open on any device.

### Deploying to Netlify
`netlify.toml` is already set up (no build step, publishes the repo root).
Connect the repo in Netlify and it deploys automatically.

## Python CLI version
A simpler, single-image utility — handy for quick one-off checks rather
than dataset building.
```bash
pip install -r requirements.txt
python main.py
```

## Uploading to GitHub from mobile
1. Create a new repository in the GitHub app (or github.com in your browser).
2. Use "Add file → Upload files" and upload all the files above, keeping
   their names exactly as they are.
3. Commit directly to the `main` branch.
4. 
