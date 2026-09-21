/* ============================================
   Flamingo — Image & Video Tools for AI
   Two independent tools sharing one page:
   the Image Inspector (single image) and the
   Dataset Builder (many images/videos, for training).
   ============================================ */

// ---------- Tabs ----------

(() => {
  const tabInspector = document.getElementById('tabBtnInspector');
  const tabDataset = document.getElementById('tabBtnDataset');
  const panelInspector = document.getElementById('panelInspector');
  const panelDataset = document.getElementById('panelDataset');

  function activate(tab) {
    const showInspector = tab === 'inspector';
    tabInspector.classList.toggle('is-active', showInspector);
    tabDataset.classList.toggle('is-active', !showInspector);
    tabInspector.setAttribute('aria-selected', String(showInspector));
    tabDataset.setAttribute('aria-selected', String(!showInspector));
    panelInspector.hidden = !showInspector;
    panelDataset.hidden = showInspector;
  }

  tabInspector.addEventListener('click', () => activate('inspector'));
  tabDataset.addEventListener('click', () => activate('dataset'));
})();

// ============================================
// Tool 1: Image Inspector
// Load, display, inspect, grayscale, resize,
// convert to numeric array, and save one image.
// ============================================

(() => {
  const dropzone = document.getElementById('imgDropzone');
  const dropzoneEmpty = document.getElementById('imgDropzoneEmpty');
  const canvasWrap = document.getElementById('imgCanvasWrap');
  const canvas = document.getElementById('imgPreviewCanvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.getElementById('imgFileInput');

  const statDimensions = document.getElementById('imgStatDimensions');
  const statSize = document.getElementById('imgStatSize');
  const statFormat = document.getElementById('imgStatFormat');

  const btnGrayscale = document.getElementById('imgBtnGrayscale');
  const btnReset = document.getElementById('imgBtnReset');
  const btnResize = document.getElementById('imgBtnResize');
  const btnSave = document.getElementById('imgBtnSave');
  const btnNumeric = document.getElementById('imgBtnNumeric');
  const btnDownloadArray = document.getElementById('imgBtnDownloadArray');

  const inputWidth = document.getElementById('imgInputWidth');
  const inputHeight = document.getElementById('imgInputHeight');
  const lockAspect = document.getElementById('imgLockAspect');

  const numericStats = document.getElementById('imgNumericStats');
  const numericPreview = document.getElementById('imgNumericPreview');
  const statShape = document.getElementById('imgStatShape');
  const statValues = document.getElementById('imgStatValues');

  let originalImage = null;
  let originalFile = null;
  let aspectRatio = 1;
  let numericArray = null;

  const controlEls = [btnGrayscale, btnReset, btnResize, btnSave, btnNumeric, inputWidth, inputHeight, lockAspect];

  function setControlsEnabled(enabled) {
    controlEls.forEach(el => { el.disabled = !enabled; });
  }

  function invalidateNumericArray() {
    numericArray = null;
    numericStats.hidden = true;
    numericPreview.hidden = true;
    btnDownloadArray.disabled = true;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatName(mime) {
    if (!mime) return 'Unknown';
    return mime.replace('image/', '').toUpperCase();
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    originalFile = file;
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      originalImage = img;
      aspectRatio = img.naturalWidth / img.naturalHeight;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      dropzoneEmpty.hidden = true;
      canvasWrap.hidden = false;

      updateStats(img.naturalWidth, img.naturalHeight, file);

      inputWidth.value = img.naturalWidth;
      inputHeight.value = img.naturalHeight;

      setControlsEnabled(true);
      invalidateNumericArray();
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  function updateStats(width, height, file) {
    statDimensions.textContent = `${width} × ${height} px`;
    statSize.textContent = formatBytes(file.size);
    statFormat.textContent = formatName(file.type);
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragging');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Grayscale

  btnGrayscale.addEventListener('click', () => {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    ctx.putImageData(frame, 0, 0);
    invalidateNumericArray();
  });

  btnReset.addEventListener('click', () => {
    if (!originalImage) return;
    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;
    ctx.drawImage(originalImage, 0, 0);
    inputWidth.value = originalImage.naturalWidth;
    inputHeight.value = originalImage.naturalHeight;
    updateStats(originalImage.naturalWidth, originalImage.naturalHeight, originalFile);
    invalidateNumericArray();
  });

  // Resize

  inputWidth.addEventListener('input', () => {
    if (!lockAspect.checked) return;
    const w = parseInt(inputWidth.value, 10);
    if (w > 0) inputHeight.value = Math.round(w / aspectRatio);
  });

  inputHeight.addEventListener('input', () => {
    if (!lockAspect.checked) return;
    const h = parseInt(inputHeight.value, 10);
    if (h > 0) inputWidth.value = Math.round(h * aspectRatio);
  });

  btnResize.addEventListener('click', () => {
    const targetW = parseInt(inputWidth.value, 10);
    const targetH = parseInt(inputHeight.value, 10);
    if (!targetW || !targetH || targetW < 1 || targetH < 1) return;

    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    scratch.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(scratch, 0, 0, targetW, targetH);

    statDimensions.textContent = `${targetW} × ${targetH} px`;
    invalidateNumericArray();
  });

  // Numeric array

  btnNumeric.addEventListener('click', () => {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = frame;
    const array = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        row.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
      }
      array.push(row);
    }

    numericArray = array;

    statShape.textContent = `${height} × ${width} × 4`;
    statValues.textContent = (height * width * 4).toLocaleString();
    numericStats.hidden = false;

    const sample = array[0]
      .slice(0, 3)
      .map(pixel => `[${pixel.join(', ')}]`)
      .join('\n');
    numericPreview.textContent = `First row, first 3 pixels (R, G, B, A):\n${sample}\n…`;
    numericPreview.hidden = false;

    btnDownloadArray.disabled = false;
  });

  btnDownloadArray.addEventListener('click', () => {
    if (!numericArray) return;
    const blob = new Blob([JSON.stringify(numericArray)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'image-numeric-array.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  // Save

  btnSave.addEventListener('click', () => {
    const mime = (originalFile && originalFile.type) || 'image/png';
    const extension = mime.includes('png') ? 'png'
      : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg'
      : mime.includes('webp') ? 'webp'
      : 'png';

    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `processed-image.${extension}`;
      link.click();
      URL.revokeObjectURL(link.href);
    }, mime);
  });
})();

// ============================================
// Tool 2: Dataset Builder
// Classes, labeled images/videos, preprocessing,
// train/test split, export as JSON.
// ============================================

(() => {
  let classes = [];
  let images = [];
  let colorMode = 'rgb';
  let nextId = 1;

  const classNameInput = document.getElementById('dsClassNameInput');
  const btnAddClass = document.getElementById('dsBtnAddClass');
  const classChips = document.getElementById('dsClassChips');

  const dropzone = document.getElementById('dsDropzone');
  const fileInput = document.getElementById('dsFileInput');
  const frameInterval = document.getElementById('dsFrameInterval');
  const videoProgress = document.getElementById('dsVideoProgress');
  const videoProgressLabel = document.getElementById('dsVideoProgressLabel');
  const progressFill = document.getElementById('dsProgressFill');
  const gallerySummary = document.getElementById('dsGallerySummary');
  const summaryTotal = document.getElementById('dsSummaryTotal');
  const summaryUnlabeled = document.getElementById('dsSummaryUnlabeled');
  const gallery = document.getElementById('dsGallery');

  const targetWidth = document.getElementById('dsTargetWidth');
  const targetHeight = document.getElementById('dsTargetHeight');
  const modeColor = document.getElementById('dsModeColor');
  const modeGray = document.getElementById('dsModeGray');
  const normalizeToggle = document.getElementById('dsNormalizeToggle');

  const splitRatio = document.getElementById('dsSplitRatio');
  const splitLabel = document.getElementById('dsSplitLabel');
  const shuffleToggle = document.getElementById('dsShuffleToggle');
  const statOutputShape = document.getElementById('dsStatOutputShape');
  const statSplitCounts = document.getElementById('dsStatSplitCounts');
  const btnExport = document.getElementById('dsBtnExport');
  const exportNote = document.getElementById('dsExportNote');

  // Classes

  function addClass(rawName) {
    const name = rawName.trim();
    if (!name) return;
    const exists = classes.some(c => c.toLowerCase() === name.toLowerCase());
    if (exists) return;
    classes.push(name);
    renderClassChips();
    renderGallery();
    updateExportState();
  }

  function removeClass(name) {
    classes = classes.filter(c => c !== name);
    images.forEach(item => { if (item.label === name) item.label = null; });
    renderClassChips();
    renderGallery();
    updateSummary();
    updateExportState();
  }

  function renderClassChips() {
    classChips.innerHTML = '';
    if (classes.length === 0) {
      const note = document.createElement('p');
      note.className = 'empty-note';
      note.textContent = 'No classes yet.';
      classChips.appendChild(note);
      return;
    }
    classes.forEach(name => {
      const count = images.filter(i => i.label === name).length;
      const chip = document.createElement('span');
      chip.className = 'chip';

      const label = document.createElement('span');
      label.textContent = name;
      chip.appendChild(label);

      const countEl = document.createElement('span');
      countEl.className = 'chip-count';
      countEl.textContent = String(count);
      chip.appendChild(countEl);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'chip-remove';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', `Remove class ${name}`);
      removeBtn.textContent = '\u00D7';
      removeBtn.addEventListener('click', () => removeClass(name));
      chip.appendChild(removeBtn);

      classChips.appendChild(chip);
    });
  }

  btnAddClass.addEventListener('click', () => {
    addClass(classNameInput.value);
    classNameInput.value = '';
    classNameInput.focus();
  });

  classNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addClass(classNameInput.value);
      classNameInput.value = '';
    }
  });

  // Import: images directly, videos via frame extraction

  function addImageFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      images.push({ id: nextId++, url, img, label: null });
      renderGallery();
      renderClassChips();
      updateSummary();
      updateExportState();
    };

    img.src = url;
  }

  function loadImageFromUrl(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function seekVideoTo(video, time) {
    return new Promise((resolve) => {
      function onSeeked() {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  }

  function showVideoProgress(name, done, total) {
    videoProgress.hidden = false;
    videoProgressLabel.textContent = `Extracting frames from ${name} — ${done}/${total}`;
    progressFill.style.width = total ? `${(done / total) * 100}%` : '0%';
  }

  function hideVideoProgress() {
    videoProgress.hidden = true;
  }

  const MAX_FRAMES_PER_VIDEO = 90;

  async function extractVideoFrames(file) {
    const interval = Math.max(0.1, parseFloat(frameInterval.value) || 1);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const sourceUrl = URL.createObjectURL(file);
    video.src = sourceUrl;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    const timestamps = [];
    for (let t = 0; t < video.duration && timestamps.length < MAX_FRAMES_PER_VIDEO; t += interval) {
      timestamps.push(t);
    }

    for (let i = 0; i < timestamps.length; i++) {
      showVideoProgress(file.name, i, timestamps.length);
      await seekVideoTo(video, timestamps[i]);

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = video.videoWidth;
      frameCanvas.height = video.videoHeight;
      frameCanvas.getContext('2d').drawImage(video, 0, 0);

      const blob = await new Promise(resolve => frameCanvas.toBlob(resolve, 'image/jpeg', 0.92));
      const frameUrl = URL.createObjectURL(blob);
      const img = await loadImageFromUrl(frameUrl);

      images.push({ id: nextId++, url: frameUrl, img, label: null });
      renderGallery();
      renderClassChips();
      updateSummary();
      updateExportState();
    }

    showVideoProgress(file.name, timestamps.length, timestamps.length);
    URL.revokeObjectURL(sourceUrl);
    hideVideoProgress();
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        addImageFile(file);
      } else if (file.type.startsWith('video/')) {
        await extractVideoFrames(file);
      }
    }
  }

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragging');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
  });

  function removeImage(id) {
    const item = images.find(i => i.id === id);
    if (item) URL.revokeObjectURL(item.url);
    images = images.filter(i => i.id !== id);
    renderGallery();
    renderClassChips();
    updateSummary();
    updateExportState();
  }

  function renderGallery() {
    gallery.innerHTML = '';

    images.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = item.url;
      img.alt = '';
      card.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', 'Remove image');
      removeBtn.textContent = '\u00D7';
      removeBtn.addEventListener('click', () => removeImage(item.id));
      card.appendChild(removeBtn);

      const controls = document.createElement('div');
      controls.className = 'item-controls';

      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Class label');

      const unlabeledOpt = document.createElement('option');
      unlabeledOpt.value = '';
      unlabeledOpt.textContent = 'Unlabeled';
      select.appendChild(unlabeledOpt);

      classes.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (item.label === name) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', () => {
        item.label = select.value || null;
        renderClassChips();
        updateSummary();
        updateExportState();
      });

      controls.appendChild(select);
      card.appendChild(controls);

      gallery.appendChild(card);
    });
  }

  function updateSummary() {
    const total = images.length;
    const unlabeled = images.filter(i => !i.label).length;
    gallerySummary.hidden = total === 0;
    summaryTotal.textContent = `${total} image${total === 1 ? '' : 's'}`;
    summaryUnlabeled.textContent = `${unlabeled} unlabeled`;
  }

  // Preprocessing

  function setColorMode(mode) {
    colorMode = mode;
    modeColor.classList.toggle('is-active', mode === 'rgb');
    modeColor.setAttribute('aria-checked', String(mode === 'rgb'));
    modeGray.classList.toggle('is-active', mode === 'grayscale');
    modeGray.setAttribute('aria-checked', String(mode === 'grayscale'));
    updateOutputShape();
  }

  modeColor.addEventListener('click', () => setColorMode('rgb'));
  modeGray.addEventListener('click', () => setColorMode('grayscale'));

  function updateOutputShape() {
    const w = Math.max(1, parseInt(targetWidth.value, 10) || 1);
    const h = Math.max(1, parseInt(targetHeight.value, 10) || 1);
    const channels = colorMode === 'grayscale' ? 1 : 3;
    statOutputShape.textContent = `${h} × ${w} × ${channels}`;
  }

  targetWidth.addEventListener('input', updateOutputShape);
  targetHeight.addEventListener('input', updateOutputShape);

  // Split

  function updateSplitPreview() {
    const ratio = parseInt(splitRatio.value, 10);
    splitLabel.textContent = `${ratio}% / ${100 - ratio}%`;

    const labeledCount = images.filter(i => i.label).length;
    const trainCount = Math.round(labeledCount * (ratio / 100));
    const testCount = labeledCount - trainCount;
    statSplitCounts.textContent = `${trainCount} / ${testCount}`;
  }

  splitRatio.addEventListener('input', updateSplitPreview);

  // Export readiness

  function updateExportState() {
    const labeledCount = images.filter(i => i.label).length;
    const ready = classes.length > 0 && labeledCount > 0;
    btnExport.disabled = !ready;
    exportNote.textContent = ready
      ? `Ready to export ${labeledCount} labeled item${labeledCount === 1 ? '' : 's'}.`
      : 'Add a class and label at least one item to enable export.';
    updateSplitPreview();
  }

  // Processing into numeric arrays

  function processImage(item, width, height, mode, normalize) {
    const scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    const sctx = scratch.getContext('2d');
    sctx.drawImage(item.img, 0, 0, width, height);

    const { data } = sctx.getImageData(0, 0, width, height);
    const rows = [];

    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (mode === 'grayscale') {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          row.push([normalize ? round4(gray / 255) : Math.round(gray)]);
        } else if (normalize) {
          row.push([round4(data[i] / 255), round4(data[i + 1] / 255), round4(data[i + 2] / 255)]);
        } else {
          row.push([data[i], data[i + 1], data[i + 2]]);
        }
      }
      rows.push(row);
    }

    return rows;
  }

  function round4(n) { return Math.round(n * 10000) / 10000; }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  btnExport.addEventListener('click', () => {
    btnExport.disabled = true;
    const labelSpan = btnExport.querySelector('span');
    const originalLabel = labelSpan.textContent;
    labelSpan.textContent = 'Building dataset…';

    setTimeout(() => {
      const width = Math.max(1, parseInt(targetWidth.value, 10) || 64);
      const height = Math.max(1, parseInt(targetHeight.value, 10) || 64);
      const normalize = normalizeToggle.checked;
      const ratio = parseInt(splitRatio.value, 10) / 100;

      let labeled = images.filter(i => i.label);
      if (shuffleToggle.checked) labeled = shuffleArray(labeled);

      const splitIndex = Math.round(labeled.length * ratio);
      const trainSet = labeled.slice(0, splitIndex);
      const testSet = labeled.slice(splitIndex);

      const buildSplit = (set) => set.map(item => ({
        label: item.label,
        data: processImage(item, width, height, colorMode, normalize),
      }));

      const dataset = {
        classes,
        image_shape: [height, width, colorMode === 'grayscale' ? 1 : 3],
        normalized: normalize,
        train: buildSplit(trainSet),
        test: buildSplit(testSet),
      };

      const blob = new Blob([JSON.stringify(dataset)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'flamingo-dataset.json';
      link.click();
      URL.revokeObjectURL(link.href);

      btnExport.disabled = false;
      labelSpan.textContent = originalLabel;
    }, 30);
  });

  // Init

  renderClassChips();
  updateSummary();
  updateOutputShape();
  updateExportState();
})();
