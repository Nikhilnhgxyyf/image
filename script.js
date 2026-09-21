/* ============================================
   Aperture — Image Information & Processing Tool
   All processing happens locally via the Canvas API.
   ============================================ */

(() => {
  const dropzone = document.getElementById('dropzone');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const canvasWrap = document.getElementById('canvasWrap');
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.getElementById('fileInput');

  const statDimensions = document.getElementById('statDimensions');
  const statSize = document.getElementById('statSize');
  const statFormat = document.getElementById('statFormat');

  const btnGrayscale = document.getElementById('btnGrayscale');
  const btnReset = document.getElementById('btnReset');
  const btnResize = document.getElementById('btnResize');
  const btnSave = document.getElementById('btnSave');
  const btnNumeric = document.getElementById('btnNumeric');
  const btnDownloadArray = document.getElementById('btnDownloadArray');

  const inputWidth = document.getElementById('inputWidth');
  const inputHeight = document.getElementById('inputHeight');
  const lockAspect = document.getElementById('lockAspect');

  const numericStats = document.getElementById('numericStats');
  const numericPreview = document.getElementById('numericPreview');
  const statShape = document.getElementById('statShape');
  const statValues = document.getElementById('statValues');

  let originalImage = null;   // the pristine HTMLImageElement, for Reset
  let originalFile = null;    // the source File, for size/format
  let aspectRatio = 1;
  let numericArray = null;    // last computed pixel array, for download

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

  // ---------- 1. Load image ----------

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    originalFile = file;
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      originalImage = img;
      aspectRatio = img.naturalWidth / img.naturalHeight;

      // 2. Display the image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      dropzoneEmpty.hidden = true;
      canvasWrap.hidden = false;

      // 3. Find image dimensions
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

  // ---------- 4. Convert to grayscale ----------

  btnGrayscale.addEventListener('click', () => {
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      // Luminosity method — matches how the eye perceives brightness
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

  // ---------- 5. Resize ----------

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
    const targetWidth = parseInt(inputWidth.value, 10);
    const targetHeight = parseInt(inputHeight.value, 10);
    if (!targetWidth || !targetHeight || targetWidth < 1 || targetHeight < 1) return;

    // Draw current canvas content onto a scratch canvas, then resample
    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    scratch.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(scratch, 0, 0, targetWidth, targetHeight);

    statDimensions.textContent = `${targetWidth} × ${targetHeight} px`;
    invalidateNumericArray();
  });

  // ---------- 6. Convert to numeric array ----------

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

  // ---------- 7. Save processed image ----------

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
                              
