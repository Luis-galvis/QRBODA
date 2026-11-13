// ==========================================================================
// ÁLBUM FOTOGRÁFICO OFICIAL & CÁMARA QR - BODA FERNANDO & LUISA FERNANDA
// Subida directa a Google Drive (1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci)
// + Respaldo instantáneo en la Nube & Mural en Vivo + Generador de Tarjeta QR
// ==========================================================================

const WEDDING_CONFIG = {
  groom: 'Fernando',
  bride: 'Luisa Fernanda',
  dateText: '14 • Noviembre • 2026 • Ibagué, Tolima',
  driveFolderId: '1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci?usp=sharing',
  supabaseUrl: 'https://tapusiqdotxhtnyxavta.supabase.co',
  supabaseBucket: 'wedding-photos',
  // Clave de acceso al bucket de fotos de la boda
  supabaseStorageKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0',
  ntfyTopic: 'boda-edgar-fernando-luisa-fernanda-fotos-2026'
};

const DEFAULT_DRIVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIowCxSFJmHs0D9DmkAgs1lAOLQArtNt4MgCIr-SYDmVQ3xMeufPpI6XDxt0zc-87cBw/exec';

// Estado de la aplicación
const AppState = {
  stagedFiles: [], // [{ id, rawDataUrl, stampedDataUrl, finalBlob, fileName }]
  liveStream: null,
  facingMode: 'user',
  useTimer3s: false,
  driveScriptUrl: localStorage.getItem('wedding_drive_script_url') || DEFAULT_DRIVE_SCRIPT_URL,
  galleryPhotos: [],
  qrInstance: null
};

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initAmbientParticles();
  restoreSavedGuestName();
  setupFileInputs();
  await fetchCloudDriveConfig();
  await loadLiveWeddingGallery(false);
  initQRCodeWidget();

  // Si la URL tiene ?qr=true, abrir automáticamente el modal del QR
  const params = new URLSearchParams(window.location.search);
  if (params.get('qr') === 'true' || params.get('mesa') === 'true') {
    openQRModal();
  }
  if (params.get('admin') === 'true' || params.get('drive') === 'true') {
    openDriveSetupModal();
  }
});

// Partículas románticas doradas y verde oliva
function initAmbientParticles() {
  const container = document.getElementById('ambient-particles');
  if (!container) return;

  const count = 22;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 3;
    const isGold = Math.random() > 0.35;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = isGold
      ? 'radial-gradient(circle, #fff3c4 0%, #c5a059 100%)'
      : 'radial-gradient(circle, #dbe4d4 0%, #6f805b 100%)';
    p.style.animationDuration = `${Math.random() * 12 + 10}s`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    container.appendChild(p);
  }
}

// Recordar el nombre del invitado en su celular para que no tenga que escribirlo cada vez
function restoreSavedGuestName() {
  const savedName = localStorage.getItem('wedding_photo_guest_name');
  const nameInput = document.getElementById('guestNameInput');
  if (savedName && nameInput) {
    nameInput.value = savedName;
  }
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      localStorage.setItem('wedding_photo_guest_name', nameInput.value.trim());
    });
  }
}

// ==========================================================================
// CONFIGURACIÓN DE PUENTE GOOGLE DRIVE EN LA NUBE
// ==========================================================================
async function fetchCloudDriveConfig() {
  try {
    const res = await fetch(
      `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/config/drive_config.json?t=${Date.now()}`
    );
    if (res.ok) {
      const cfg = await res.json();
      if (cfg && cfg.scriptUrl) {
        AppState.driveScriptUrl = cfg.scriptUrl;
        localStorage.setItem('wedding_drive_script_url', cfg.scriptUrl);
      }
    }
  } catch (e) {
    console.warn('Usando configuración local de Drive:', e);
  }

  const input = document.getElementById('driveScriptUrlInput');
  if (input && AppState.driveScriptUrl) {
    input.value = AppState.driveScriptUrl;
  }
}

window.saveDriveScriptUrlConfig = async function () {
  const input = document.getElementById('driveScriptUrlInput');
  const scriptUrl = input ? input.value.trim() : '';

  if (scriptUrl && !scriptUrl.startsWith('https://script.google.com/')) {
    alert('Por favor pega una URL válida de Google Apps Script que comience por https://script.google.com/macros/s/...');
    return;
  }

  AppState.driveScriptUrl = scriptUrl;
  localStorage.setItem('wedding_drive_script_url', scriptUrl);

  try {
    await fetch(
      `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/${WEDDING_CONFIG.supabaseBucket}/config/drive_config.json`,
      {
        method: 'POST',
        headers: {
          apikey: WEDDING_CONFIG.supabaseStorageKey,
          Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body: JSON.stringify({
          folderId: WEDDING_CONFIG.driveFolderId,
          folderUrl: WEDDING_CONFIG.driveFolderUrl,
          scriptUrl: scriptUrl,
          updatedAt: new Date().toISOString()
        })
      }
    );
    showToast('✓ ¡Conexión con Google Drive guardada para todos los invitados!');
    closeDriveSetupModal();
  } catch (err) {
    console.error(err);
    showToast('✓ Guardado en este dispositivo');
  }
};

// ==========================================================================
// CAPTURA DE FOTOS: CÁMARA DEL CELULAR, GALERÍA Y CABINA EN VIVO
// ==========================================================================
function setupFileInputs() {
  const camInput = document.getElementById('nativeCameraInput');
  const selfieInput = document.getElementById('nativeSelfieInput');
  const galInput = document.getElementById('galleryFilesInput');

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    await processIncomingFiles(files);
    event.target.value = '';
  };

  if (camInput) camInput.addEventListener('change', handleFilesSelected);
  if (selfieInput) selfieInput.addEventListener('change', handleFilesSelected);
  if (galInput) galInput.addEventListener('change', handleFilesSelected);
}

window.triggerNativeCamera = function () {
  const Banner = document.getElementById('uploadSuccessBanner');
  if (Banner) Banner.classList.remove('active');
  const camInput = document.getElementById('nativeCameraInput');
  if (camInput) camInput.click();
};

window.triggerGalleryPicker = function () {
  const Banner = document.getElementById('uploadSuccessBanner');
  if (Banner) Banner.classList.remove('active');
  const galInput = document.getElementById('galleryFilesInput');
  if (galInput) galInput.click();
};

// Cabina Fotográfica en Vivo (WebRTC)
window.toggleLiveCameraBooth = async function () {
  const modal = document.getElementById('liveCameraModal');
  if (!modal) return;

  if (modal.classList.contains('active')) {
    stopLiveCameraBooth();
  } else {
    await startLiveCameraBooth();
  }
};

async function startLiveCameraBooth() {
  const modal = document.getElementById('liveCameraModal');
  const video = document.getElementById('cameraVideoStream');

  try {
    if (AppState.liveStream) {
      AppState.liveStream.getTracks().forEach(t => t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: AppState.facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1440 }
      },
      audio: false
    });

    AppState.liveStream = stream;
    if (video) {
      video.srcObject = stream;
      video.classList.toggle('mirrored', AppState.facingMode === 'user');
    }
    if (modal) modal.classList.add('active');
  } catch (err) {
    console.warn('No se pudo abrir WebRTC directo, abriendo cámara nativa del celular:', err);
    triggerNativeCamera();
  }
}

window.stopLiveCameraBooth = function () {
  const modal = document.getElementById('liveCameraModal');
  if (AppState.liveStream) {
    AppState.liveStream.getTracks().forEach(t => t.stop());
    AppState.liveStream = null;
  }
  if (modal) modal.classList.remove('active');
};

window.flipLiveCamera = async function () {
  AppState.facingMode = AppState.facingMode === 'user' ? 'environment' : 'user';
  await startLiveCameraBooth();
};

window.toggleCameraTimer = function () {
  AppState.useTimer3s = !AppState.useTimer3s;
  const btn = document.getElementById('btnTimerToggle');
  if (btn) {
    btn.textContent = AppState.useTimer3s ? '⏱️ 3s: ON' : '⏱️ 3s: OFF';
    btn.classList.toggle('active', AppState.useTimer3s);
  }
};

window.snapLivePhoto = async function () {
  const video = document.getElementById('cameraVideoStream');
  const countdownEl = document.getElementById('cameraCountdownOverlay');
  const flashEl = document.getElementById('cameraFlashEffect');
  if (!video || !AppState.liveStream) return;

  if (AppState.useTimer3s && countdownEl) {
    countdownEl.style.display = 'flex';
    for (let sec = 3; sec >= 1; sec--) {
      countdownEl.textContent = sec;
      await new Promise(r => setTimeout(r, 900));
    }
    countdownEl.style.display = 'none';
  }

  // Efecto flash
  if (flashEl) {
    flashEl.classList.add('flash');
    setTimeout(() => flashEl.classList.remove('flash'), 220);
  }

  // Capturar frame del video
  const canvas = document.createElement('canvas');
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 960;
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext('2d');

  if (AppState.facingMode === 'user') {
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, vw, vh);

  const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  await addRawPhotoToStaging(rawDataUrl);
  showToast('📸 ¡Foto capturada! Revisa abajo para guardarla');
};

// ==========================================================================
// PROCESAMIENTO Y SELLO DORADO CONMEMORATIVO DE LA BODA
// ==========================================================================
async function processIncomingFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const rawDataUrl = await readFileAsDataURL(file);
    await addRawPhotoToStaging(rawDataUrl);
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addRawPhotoToStaging(rawDataUrl) {
  const id = 'foto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const processed = await renderPhotoWithOptionalFrame(rawDataUrl);

  AppState.stagedFiles.push({
    id,
    rawDataUrl,
    stampedDataUrl: processed.dataUrl,
    finalBlob: processed.blob
  });

  renderStagingUI();

  // Desplazar suavemente hacia la vista previa
  const stagingArea = document.getElementById('previewStagingArea');
  if (stagingArea) {
    stagingArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

window.refreshStagedPreviews = async function () {
  for (const item of AppState.stagedFiles) {
    const processed = await renderPhotoWithOptionalFrame(item.rawDataUrl);
    item.stampedDataUrl = processed.dataUrl;
    item.finalBlob = processed.blob;
  }
  renderStagingUI();
};

async function renderPhotoWithOptionalFrame(rawDataUrl) {
  const includeWatermark = document.getElementById('chkWeddingWatermark')?.checked ?? true;
  const guestName = document.getElementById('guestNameInput')?.value.trim() || '';

  const img = await loadImageElement(rawDataUrl);
  const maxDim = 1920;
  let w = img.width;
  let h = img.height;

  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const footerHeight = includeWatermark ? Math.max(Math.round(h * 0.11), 95) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h + footerHeight;
  const ctx = canvas.getContext('2d');

  // 1. Dibujar foto principal
  ctx.drawImage(img, 0, 0, w, h);

  // 2. Si el invitado desea el sello conmemorativo de la boda
  if (includeWatermark) {
    // Fondo marfil de papelería fina en el pie tipo Polaroid
    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, h, w, footerHeight);

    // Línea divisoria dorada doble
    const grad = ctx.createLinearGradient(0, h, w, h);
    grad.addColorStop(0, '#9e7a32');
    grad.addColorStop(0.5, '#e4c88a');
    grad.addColorStop(1, '#9e7a32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h, w, Math.max(3, Math.round(footerHeight * 0.04)));

    // Nombres de los novios
    const titleSize = Math.max(22, Math.round(footerHeight * 0.36));
    ctx.font = `600 ${titleSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#3a472c';
    ctx.textAlign = 'center';
    ctx.fillText('Fernando & Luisa Fernanda', w / 2, h + Math.round(footerHeight * 0.48));

    // Fecha y nombre del invitado
    const subSize = Math.max(12, Math.round(footerHeight * 0.2));
    ctx.font = `600 ${subSize}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = '#8f6e2b';
    const subLine = guestName
      ? `NUESTRA BODA • 14.11.2026 • FOTO POR: ${guestName.toUpperCase()}`
      : 'NUESTRA BODA • 14 • NOVIEMBRE • 2026 • IBAGUÉ';
    ctx.fillText(subLine, w / 2, h + Math.round(footerHeight * 0.8));
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const blob = await (await fetch(dataUrl)).blob();
  return { dataUrl, blob };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function renderStagingUI() {
  const area = document.getElementById('previewStagingArea');
  const grid = document.getElementById('stagingPhotosGrid');
  const countLabel = document.getElementById('stagingCountLabel');
  const btnText = document.getElementById('btnUploadText');
  if (!area || !grid) return;

  const count = AppState.stagedFiles.length;
  if (count === 0) {
    area.classList.remove('active');
    return;
  }

  area.classList.add('active');
  if (countLabel) {
    countLabel.textContent = count === 1
      ? '1 Foto lista para guardar'
      : `${count} Fotos listas para guardar`;
  }
  if (btnText) {
    btnText.textContent = count === 1
      ? '☁️ Guardar Foto en Google Drive de la Boda'
      : `☁️ Guardar ${count} Fotos en Google Drive de la Boda`;
  }

  grid.innerHTML = '';
  AppState.stagedFiles.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'staged-photo-card';
    card.innerHTML = `
      <img src="${item.stampedDataUrl}" alt="Vista previa ${idx + 1}">
      <button type="button" class="staged-remove-btn" onclick="removeStagedPhoto('${item.id}')" title="Quitar foto">✕</button>
      <div class="staged-polaroid-caption">Recuerdo #${idx + 1}</div>
    `;
    grid.appendChild(card);
  });
}

window.removeStagedPhoto = function (id) {
  AppState.stagedFiles = AppState.stagedFiles.filter(f => f.id !== id);
  renderStagingUI();
};

window.clearStagedPhotos = function () {
  AppState.stagedFiles = [];
  renderStagingUI();
};

// ==========================================================================
// SUBIDA DUAL: GOOGLE DRIVE (1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci) + NUBE EN VIVO
// ==========================================================================
window.uploadStagedPhotosToDrive = async function () {
  if (AppState.stagedFiles.length === 0) return;

  // Volver a generar el sello por si el invitado escribió su nombre después de tomar la foto
  await refreshStagedPreviews();

  const guestName = document.getElementById('guestNameInput')?.value.trim() || 'Invitado de Honor';
  const caption = document.getElementById('guestCaptionInput')?.value.trim() || '';

  const btn = document.getElementById('btnUploadToDrive');
  const progressBox = document.getElementById('uploadProgressBox');
  const progressFill = document.getElementById('uploadProgressFill');
  const progressText = document.getElementById('uploadProgressText');
  const successBanner = document.getElementById('uploadSuccessBanner');

  if (btn) btn.disabled = true;
  if (progressBox) progressBox.classList.add('active');
  if (successBanner) successBanner.classList.remove('active');

  const total = AppState.stagedFiles.length;
  let uploadedCount = 0;

  for (let i = 0; i < total; i++) {
    const item = AppState.stagedFiles[i];
    const pct = Math.round(((i + 0.3) / total) * 100);
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressText) {
      progressText.textContent = `Subiendo foto ${i + 1} de ${total} al álbum oficial de la boda...`;
    }

    const timestamp = Date.now();
    const safeGuest = guestName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').slice(0, 28) || 'Invitado';
    const fileKey = `${timestamp}_${safeGuest}_${Math.random().toString(36).slice(2, 6)}`;
    const fileName = `Boda_Fernando_y_Luisa_${safeGuest}_${timestamp}.jpg`;

    // 1. Subir al almacenamiento oficial en la nube (Supabase Storage wedding-photos)
    let publicPhotoUrl = '';
    try {
      const storagePath = `fotos/${fileKey}.jpg`;
      const upRes = await fetch(
        `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/${WEDDING_CONFIG.supabaseBucket}/${storagePath}`,
        {
          method: 'POST',
          headers: {
            apikey: WEDDING_CONFIG.supabaseStorageKey,
            Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
          },
          body: item.finalBlob
        }
      );

      if (upRes.ok) {
        publicPhotoUrl = `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/${storagePath}`;
      }

      // Guardar metadatos (nombre del invitado, dedicatoria, fecha)
      const metaObj = {
        id: fileKey,
        fileName,
        guestName,
        caption,
        photoUrl: publicPhotoUrl,
        driveFolderId: WEDDING_CONFIG.driveFolderId,
        createdAt: new Date().toISOString()
      };

      await fetch(
        `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/${WEDDING_CONFIG.supabaseBucket}/meta/${fileKey}.json`,
        {
          method: 'POST',
          headers: {
            apikey: WEDDING_CONFIG.supabaseStorageKey,
            Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true'
          },
          body: JSON.stringify(metaObj)
        }
      );
    } catch (cloudErr) {
      console.warn('Error en respaldo cloud:', cloudErr);
    }

    // 2. Enviar directamente a la carpeta de Google Drive (1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci)
    await sendPhotoToGoogleDriveFolder({
      base64DataUrl: item.stampedDataUrl,
      fileName,
      guestName,
      caption,
      publicPhotoUrl
    });

    uploadedCount++;
    const donePct = Math.round((uploadedCount / total) * 100);
    if (progressFill) progressFill.style.width = `${donePct}%`;
  }

  // 3. Notificación en tiempo real para los novios
  fetch(`https://ntfy.sh/${WEDDING_CONFIG.ntfyTopic}`, {
    method: 'POST',
    headers: {
      Title: `📸 Nueva foto de ${guestName}`,
      Tags: 'camera_with_flash,ring'
    },
    body: `${guestName} acaba de subir ${uploadedCount} foto(s) al álbum de la boda.${caption ? ` Mensaje: "${caption}"` : ''}`
  }).catch(() => {});

  // Limpiar cola y mostrar confirmación
  AppState.stagedFiles = [];
  renderStagingUI();
  stopLiveCameraBooth();

  if (btn) btn.disabled = false;
  if (progressBox) progressBox.classList.remove('active');
  if (progressFill) progressFill.style.width = '0%';

  const captionInput = document.getElementById('guestCaptionInput');
  if (captionInput) captionInput.value = '';

  if (successBanner) {
    successBanner.classList.add('active');
    successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showToast('✨ ¡Foto guardada en el álbum de la boda!');
  await loadLiveWeddingGallery(false);
};

// Envía la foto al puente de Google Drive (Google Apps Script o Serverless API /api/upload)
async function sendPhotoToGoogleDriveFolder({ base64DataUrl, fileName, guestName, caption, publicPhotoUrl }) {
  const base64Clean = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
  const payload = {
    action: 'uploadPhoto',
    folderId: WEDDING_CONFIG.driveFolderId,
    fileName,
    mimeType: 'image/jpeg',
    base64: base64Clean,
    guestName,
    caption,
    publicPhotoUrl
  };

  // A. Si el puente Google Apps Script está configurado, enviar directo a Drive
  if (AppState.driveScriptUrl) {
    try {
      await fetch(AppState.driveScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Envío directo a Google Apps Script:', e);
    }
  }

  // B. Intentar también vía endpoint serverless de Vercel (/api/upload) si está desplegado
  try {
    await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    // Ignorar en entorno puramente estático
  }
}

// ==========================================================================
// MURAL EN VIVO DE LA BODA (CARGA EN TIEMPO REAL)
// ==========================================================================
window.loadLiveWeddingGallery = async function (showNotification = false) {
  const grid = document.getElementById('weddingGalleryGrid');
  const badge = document.getElementById('galleryCountBadge');
  if (!grid) return;

  try {
    // Listar los archivos subidos a wedding-photos/fotos/
    const listRes = await fetch(
      `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/list/${WEDDING_CONFIG.supabaseBucket}`,
      {
        method: 'POST',
        headers: {
          apikey: WEDDING_CONFIG.supabaseStorageKey,
          Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prefix: 'fotos/',
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      }
    );

    if (!listRes.ok) throw new Error('Error listando galería');
    const files = (await listRes.json()).filter(f => f.name && f.name.endsWith('.jpg'));

    if (badge) {
      badge.textContent = files.length === 0
        ? 'Sé el primero en inaugurar el álbum ✨'
        : `${files.length} ${files.length === 1 ? 'Recuerdo compartido' : 'Recuerdos compartidos'}`;
    }

    if (files.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty-state">
          <div style="font-size: 2rem; margin-bottom: 8px;">📸</div>
          <div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: var(--color-olive-dark);">
            ¡Inaugura el Álbum de Fernando & Luisa Fernanda!
          </div>
          <p style="font-size: 0.82rem; margin-top: 4px;">
            Toma la primera foto con el botón de arriba y aparecerá aquí y en nuestro Google Drive.
          </p>
        </div>
      `;
      return;
    }

    // Cargar metadatos de las fotos en paralelo
    const items = await Promise.all(
      files.map(async (f) => {
        const key = f.name.replace(/\.jpg$/, '');
        const photoUrl = `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/fotos/${f.name}`;
        let guestName = 'Invitado de la Boda';
        let caption = '';
        let createdAt = f.created_at;

        try {
          const metaRes = await fetch(
            `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/meta/${key}.json`
          );
          if (metaRes.ok) {
            const meta = await metaRes.json();
            guestName = meta.guestName || guestName;
            caption = meta.caption || '';
            createdAt = meta.createdAt || createdAt;
          }
        } catch (_) {}

        return { key, photoUrl, guestName, caption, createdAt };
      })
    );

    AppState.galleryPhotos = items;
    grid.innerHTML = '';

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'gallery-polaroid-item';
      card.onclick = () => openPhotoLightbox(index);

      const safeAuthor = escapeHtml(item.guestName);
      const safeCaption = escapeHtml(item.caption);

      card.innerHTML = `
        <div class="gallery-img-wrap">
          <img src="${item.photoUrl}" alt="Foto por ${safeAuthor}" loading="lazy">
        </div>
        <div class="gallery-meta">
          <div class="gallery-guest-author">📸 ${safeAuthor}</div>
          ${safeCaption ? `<div class="gallery-guest-caption">“${safeCaption}”</div>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });

    if (showNotification) {
      showToast('✓ Mural de fotos actualizado');
    }
  } catch (err) {
    console.warn('Error cargando mural:', err);
  }
};

// Sincronizar todas las fotos de la nube hacia la carpeta Google Drive en 1 clic
window.syncAllCloudPhotosToDrive = async function () {
  if (!AppState.driveScriptUrl) {
    alert('Primero pega la URL de tu Google Apps Script arriba y haz clic en Guardar.');
    return;
  }

  const btn = document.getElementById('btnSyncAllToDrive');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Sincronizando fotos hacia Google Drive...';
  }

  try {
    await loadLiveWeddingGallery(false);
    const photos = AppState.galleryPhotos || [];

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (btn) {
        btn.textContent = `⏳ Enviando a Drive (${i + 1}/${photos.length})...`;
      }
      // Descargar imagen y convertir a base64 para enviarla al Apps Script
      const imgRes = await fetch(p.photoUrl);
      const blob = await imgRes.blob();
      const base64DataUrl = await readFileAsDataURL(blob);
      await sendPhotoToGoogleDriveFolder({
        base64DataUrl,
        fileName: `Boda_Fernando_y_Luisa_${p.key}.jpg`,
        guestName: p.guestName,
        caption: p.caption,
        publicPhotoUrl: p.photoUrl
      });
    }

    showToast(`✓ ¡${photos.length} foto(s) sincronizadas con tu carpeta de Google Drive!`);
  } catch (e) {
    console.error(e);
    showToast('⚠️ Error durante la sincronización');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '☁️ Sincronizar todas las fotos existentes hacia Google Drive';
    }
  }
};

// ==========================================================================
// LIGHTBOX DE FOTOS PANTALLA COMPLETA
// ==========================================================================
window.openPhotoLightbox = function (index) {
  const item = AppState.galleryPhotos[index];
  if (!item) return;

  const overlay = document.getElementById('lightboxOverlay');
  const img = document.getElementById('lightboxImg');
  const author = document.getElementById('lightboxAuthor');
  const caption = document.getElementById('lightboxCaption');
  const dlBtn = document.getElementById('lightboxDownloadBtn');

  if (img) img.src = item.photoUrl;
  if (author) author.textContent = `Tomada por: ${item.guestName}`;
  if (caption) caption.textContent = item.caption ? `“${item.caption}”` : 'Boda Fernando & Luisa Fernanda • 14.11.2026';
  if (dlBtn) {
    dlBtn.href = item.photoUrl;
    dlBtn.setAttribute('download', `Boda_Fernando_y_Luisa_${item.key}.jpg`);
  }
  if (overlay) overlay.classList.add('open');
};

window.closePhotoLightbox = function (event) {
  if (event && event.target && event.target.tagName === 'IMG') return;
  const overlay = document.getElementById('lightboxOverlay');
  if (overlay) overlay.classList.remove('open');
};

// ==========================================================================
// GENERADOR DE CÓDIGO QR Y TARJETA DE LUJO PARA MESAS (PNG HD)
// ==========================================================================
function getDefaultQrTargetUrl() {
  const saved = localStorage.getItem('wedding_custom_qr_url');
  if (saved) return saved;
  if (window.location.protocol.startsWith('http')) {
    return window.location.origin + window.location.pathname.replace(/tarjeta-qr\.html$/, '');
  }
  return 'https://fotos-boda-fernando-luisa.vercel.app';
}

function initQRCodeWidget() {
  const container = document.getElementById('qrcodeContainer');
  const urlInput = document.getElementById('qrTargetUrlInput');
  if (!container || typeof QRCode === 'undefined') return;

  const targetUrl = getDefaultQrTargetUrl();
  if (urlInput) urlInput.value = targetUrl;

  renderQRCodeInto(container, targetUrl);
}

function renderQRCodeInto(container, urlText) {
  container.innerHTML = '';
  AppState.qrInstance = new QRCode(container, {
    text: urlText || 'https://fotos-boda-fernando-luisa.vercel.app',
    width: 210,
    height: 210,
    colorDark: '#28331e',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

window.updateQRCodeFromInput = function () {
  const urlInput = document.getElementById('qrTargetUrlInput');
  const container = document.getElementById('qrcodeContainer');
  if (!urlInput || !container) return;

  const val = urlInput.value.trim() || 'https://fotos-boda-fernando-luisa.vercel.app';
  localStorage.setItem('wedding_custom_qr_url', val);
  renderQRCodeInto(container, val);
};

window.copyCurrentQrLink = function () {
  const urlInput = document.getElementById('qrTargetUrlInput');
  const val = urlInput ? urlInput.value.trim() : getDefaultQrTargetUrl();
  navigator.clipboard.writeText(val).then(() => {
    showToast('🔗 ¡Enlace del QR copiado al portapapeles!');
  });
};

// Descargar sólo el código QR en alta resolución
window.downloadStandaloneQrPNG = function () {
  const qrCanvas = document.querySelector('#qrcodeContainer canvas');
  if (!qrCanvas) return;

  const out = document.createElement('canvas');
  out.width = 900;
  out.height = 900;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 900);
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 12;
  ctx.strokeRect(24, 24, 852, 852);
  ctx.drawImage(qrCanvas, 90, 90, 720, 720);

  const link = document.createElement('a');
  link.download = 'QR_Fotos_Boda_Fernando_y_Luisa.png';
  link.href = out.toDataURL('image/png');
  link.click();
  showToast('✓ ¡Código QR PNG descargado!');
};

// Generar y descargar la Tarjeta QR Completa de Lujo en PNG HD (1200x1650) lista para imprimir
window.downloadLuxuryQrCardPNG = async function () {
  const qrCanvas = document.querySelector('#qrcodeContainer canvas');
  if (!qrCanvas) return;

  const canvas = document.createElement('canvas');
  const W = 1200;
  const H = 1680;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Fondo papelería fina (con card_background.jpg si carga)
  ctx.fillStyle = '#fdfcf9';
  ctx.fillRect(0, 0, W, H);
  try {
    const bgImg = await loadImageElement('assets/card_background.jpg');
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch (_) {}

  // 2. Doble marco dorado de lujo
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 6;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.strokeStyle = 'rgba(197, 160, 89, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(68, 68, W - 136, H - 136);
  ctx.setLineDash([]);

  // 3. Monograma circular en la parte superior
  try {
    const monoImg = await loadImageElement('assets/monograma_boda.jpg');
    const cx = W / 2;
    const cy = 230;
    const r = 105;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(monoImg, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.stroke();
  } catch (_) {}

  // 4. Textos de Cabecera
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8f6e2b';
  ctx.font = '600 26px "Cinzel", Georgia, serif';
  ctx.fillText('ÁLBUM FOTOGRÁFICO OFICIAL', W / 2, 405);

  ctx.fillStyle = '#3a472c';
  ctx.font = '700 76px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Fernando & Luisa Fernanda', W / 2, 495);

  ctx.fillStyle = '#5f6a54';
  ctx.font = '500 26px "Montserrat", sans-serif';
  ctx.fillText('SÁBADO, 14 DE NOVIEMBRE DE 2026 • IBAGUÉ, TOLIMA', W / 2, 550);

  // 5. Caja Blanca con Marco Dorado para el Código QR
  const qrBoxSize = 620;
  const qrBoxX = (W - qrBoxSize) / 2;
  const qrBoxY = 610;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(40, 51, 30, 0.16)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 12;
  ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 5;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  ctx.drawImage(qrCanvas, qrBoxX + 50, qrBoxY + 50, qrBoxSize - 100, qrBoxSize - 100);

  // 6. Llamado a la acción inferior
  ctx.fillStyle = '#3a472c';
  ctx.font = '700 54px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('📸 ¡Escanea y Comparte tus Fotos!', W / 2, 1325);

  ctx.fillStyle = '#5f6a54';
  ctx.font = '500 28px "Montserrat", sans-serif';
  ctx.fillText('Apunta con la cámara de tu celular a este código QR', W / 2, 1385);
  ctx.fillText('para tomar fotos y guardarlas directo en nuestro Google Drive.', W / 2, 1428);

  ctx.fillStyle = '#8f6e2b';
  ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('“Gracias por capturar junto a nosotros los recuerdos de nuestro para siempre”', W / 2, 1525);

  const link = document.createElement('a');
  link.download = 'Tarjeta_QR_Mesa_Boda_Fernando_y_Luisa.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast('🖼️ ¡Tarjeta QR de lujo descargada en alta resolución!');
};

// ==========================================================================
// MODALES Y CÓDIGO DE GOOGLE APPS SCRIPT
// ==========================================================================
window.openQRModal = function () {
  const modal = document.getElementById('qrModalOverlay');
  if (modal) {
    modal.classList.add('open');
    updateQRCodeFromInput();
  }
};

window.closeQRModal = function () {
  const modal = document.getElementById('qrModalOverlay');
  if (modal) modal.classList.remove('open');
};

window.openDriveSetupModal = function () {
  const modal = document.getElementById('driveSetupModalOverlay');
  if (modal) modal.classList.add('open');
};

window.closeDriveSetupModal = function () {
  const modal = document.getElementById('driveSetupModalOverlay');
  if (modal) modal.classList.remove('open');
};

// Código completo de Google Apps Script con el ID 1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci preconfigurado
window.copyGoogleAppsScriptCode = function () {
  const scriptCode = `// ============================================================================
// PUENTE OFICIAL DE GOOGLE DRIVE - BODA FERNANDO & LUISA FERNANDA
// Carpeta Destino: https://drive.google.com/drive/folders/1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci
// ============================================================================

const FOLDER_ID = '1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci';
const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SUPABASE_KEY = '${WEDDING_CONFIG.supabaseStorageKey}';

// 1. Recibe cada foto tomada por los invitados en tiempo real y la guarda en tu Google Drive
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(data.folderId || FOLDER_ID);
    const bytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(bytes, data.mimeType || 'image/jpeg', data.fileName || ('Boda_Foto_' + Date.now() + '.jpg'));
    const file = folder.createFile(blob);
    file.setDescription('Subida por: ' + (data.guestName || 'Invitado') + ' | Mensaje: ' + (data.caption || ''));

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Puente Google Drive Activo - Boda Fernando & Luisa Fernanda');
}

// 2. Opcional: Sincroniza automáticamente todas las fotos del álbum de la boda hacia tu carpeta Drive
function sincronizarTodasLasFotosDeLaBoda() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const existing = {};
  const filesIter = folder.getFiles();
  while (filesIter.hasNext()) {
    existing[filesIter.next().getName()] = true;
  }

  const res = UrlFetchApp.fetch(SUPABASE_URL + '/storage/v1/object/list/wedding-photos', {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    payload: JSON.stringify({ prefix: 'fotos/', limit: 500 })
  });

  const list = JSON.parse(res.getContentText());
  list.forEach(function(item) {
    if (!item.name || !item.name.endsWith('.jpg')) return;
    const driveName = 'Boda_Fernando_y_Luisa_' + item.name;
    if (existing[driveName]) return;

    const imgUrl = SUPABASE_URL + '/storage/v1/object/public/wedding-photos/fotos/' + item.name;
    const imgBlob = UrlFetchApp.fetch(imgUrl).getBlob().setName(driveName);
    folder.createFile(imgBlob);
  });
}`;

  navigator.clipboard.writeText(scriptCode).then(() => {
    showToast('📋 ¡Código copiado! Pégalo en script.google.com');
  });
};

// ==========================================================================
// UTILIDADES
// ==========================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const toast = document.getElementById('weddingToast');
  const text = document.getElementById('toastMessage');
  if (!toast) return;
  if (text) text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

