/* ============================================
   Flamingo — Image Dataset Builder for AI Training
   Everything runs locally: images are labeled, resized,
   converted to numeric arrays, split, and exported as JSON
   for training elsewhere (Python, Colab, your own pipeline).
   ============================================ */

(() => {
  // ---------- State ----------

  let classes = [];        // array of class name strings
  let images = [];         // { id, url, img, label }
  let colorMode = 'rgb';   // 'rgb' | 'grayscale'
  let nextId = 1;

  // ---------- DOM references ----------

  const classNameInput = document.getElementById('classNameInput');
  const btnAddClass = document.getElementById('btnAddClass');
  const classChips = document.getElementById('classChips');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const gallerySummary = document.getElementById('gallerySummary');
  const summaryTotal = document.getElementById('summaryTotal');
  const summaryUnlabeled = document.getElementById('summaryUnlabeled');
  const gallery = document.getElementById('gallery');

  const targetWidth = document.getElementById('targetWidth');
  const targetHeight = document.getElementById('targetHeight');
  const modeColor = document.getElementById('modeColor');
  const modeGray = document.getElementById('modeGray');
  const normalizeToggle = document.getElementById('normalizeToggle');

  const splitRatio = document.getElementById('splitRatio');
  const splitLabel = document.getElementById('splitLabel');
  const shuffleToggle = document.getElementById('shuffleToggle');
  const statOutputShape = document.getElementById('statOutputShape');
  const statSplitCounts = document.getElementById('statSplitCounts');
  const btnExport = document.getElementById('btnExport');
  const exportNote = document.getElementById('exportNote');

  // ---------- Classes (step 1) ----------

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
    images.forEach(item => {
      if (item.label === name) item.label = null;
    });
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

  // ---------- Import & label (step 2) ----------

  function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
      if (!file.type.startsWith('image/')) return;

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
    });
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

  // ---------- Preprocessing (step 3) ----------

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

  // ---------- Split (step 4) ----------

  function updateSplitPreview() {
    const ratio = parseInt(splitRatio.value, 10);
    splitLabel.textContent = `${ratio}% / ${100 - ratio}%`;

    const labeledCount = images.filter(i => i.label).length;
    const trainCount = Math.round(labeledCount * (ratio / 100));
    const testCount = labeledCount - trainCount;
    statSplitCounts.textContent = `${trainCount} / ${testCount}`;
  }

  splitRatio.addEventListener('input', updateSplitPreview);

  // ---------- Export readiness ----------

  function updateExportState() {
    const labeledCount = images.filter(i => i.label).length;
    const ready = classes.length > 0 && labeledCount > 0;
    btnExport.disabled = !ready;
    exportNote.textContent = ready
      ? `Ready to export ${labeledCount} labeled image${labeledCount === 1 ? '' : 's'}.`
      : 'Add a class and label at least one image to enable export.';
    updateSplitPreview();
  }

  // ---------- Processing an image into a numeric array ----------

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
        } else {
          if (normalize) {
            row.push([round4(data[i] / 255), round4(data[i + 1] / 255), round4(data[i + 2] / 255)]);
          } else {
            row.push([data[i], data[i + 1], data[i + 2]]);
          }
        }
      }
      rows.push(row);
    }

    return rows;
  }

  function round4(n) {
    return Math.round(n * 10000) / 10000;
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // ---------- Export ----------

  btnExport.addEventListener('click', () => {
    btnExport.disabled = true;
    const originalLabel = btnExport.querySelector('span').textContent;
    btnExport.querySelector('span').textContent = 'Building dataset…';

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
      btnExport.querySelector('span').textContent = originalLabel;
    }, 30);
  });

  // ---------- Init ----------

  renderClassChips();
  updateSummary();
  updateOutputShape();
  updateExportState();
})();
       
