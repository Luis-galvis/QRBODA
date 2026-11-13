// ==========================================================================
// ÁLBUM FOTOGRÁFICO OFICIAL & CÁMARA QR - BODA FERNANDO & LUISA FERNANDA
// Guardado Automático Ultra-Rápido al Tomar la Foto (Sin pasos extra)
// Directo a Google Drive (1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci) + Mural en Vivo
// ==========================================================================

const WEDDING_CONFIG = {
  groom: 'Fernando',
  bride: 'Luisa Fernanda',
  dateText: '14 • Noviembre • 2026 • Ibagué, Tolima',
  driveFolderId: '1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci',
  supabaseUrl: 'https://tapusiqdotxhtnyxavta.supabase.co',
  supabaseBucket: 'wedding-photos',
  supabaseStorageKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0',
  ntfyTopic: 'boda-edgar-fernando-luisa-fernanda-fotos-2026'
};

const DEFAULT_DRIVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIowCxSFJmHs0D9DmkAgs1lAOLQArtNt4MgCIr-SYDmVQ3xMeufPpI6XDxt0zc-87cBw/exec';

// Estado de la aplicación
const AppState = {
  liveStream: null,
  facingMode: 'user',
  useTimer3s: false,
  driveScriptUrl: DEFAULT_DRIVE_SCRIPT_URL,
  galleryPhotos: [],
  qrInstance: null
};

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initAmbientParticles();
  setupFileInputs();
  initQRCodeWidget();
  loadLiveWeddingGallery(false);

  const params = new URLSearchParams(window.location.search);
  if (params.get('qr') === 'true' || params.get('mesa') === 'true') {
    openQRModal();
  }
});

// Partículas románticas doradas y verde oliva
function initAmbientParticles() {
  const container = document.getElementById('ambient-particles');
  if (!container) return;

  const count = 20;
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

// ==========================================================================
// CAPTURA DE FOTOS Y GUARDADO AUTOMÁTICO INMEDIATO
// ==========================================================================
function setupFileInputs() {
  const camInput = document.getElementById('nativeCameraInput');
  const selfieInput = document.getElementById('nativeSelfieInput');
  const galInput = document.getElementById('galleryFilesInput');

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = '';
    await autoUploadFilesImmediately(files);
  };

  if (camInput) camInput.addEventListener('change', handleFilesSelected);
  if (selfieInput) selfieInput.addEventListener('change', handleFilesSelected);
  if (galInput) galInput.addEventListener('change', handleFilesSelected);
}

window.triggerNativeCamera = function () {
  const banner = document.getElementById('uploadSuccessBanner');
  if (banner) banner.classList.remove('active');
  const camInput = document.getElementById('nativeCameraInput');
  if (camInput) camInput.click();
};

window.triggerGalleryPicker = function () {
  const banner = document.getElementById('uploadSuccessBanner');
  if (banner) banner.classList.remove('active');
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
        width: { ideal: 1280 },
        height: { ideal: 960 }
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
      await new Promise(r => setTimeout(r, 850));
    }
    countdownEl.style.display = 'none';
  }

  if (flashEl) {
    flashEl.classList.add('flash');
    setTimeout(() => flashEl.classList.remove('flash'), 200);
  }

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

  stopLiveCameraBooth();
  const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  await processAndAutoSaveSinglePhoto(rawDataUrl);
};

// ==========================================================================
// OPTIMIZACIÓN ULTRA-RÁPIDA + GUARDADO AUTOMÁTICO EN PARALELO
// ==========================================================================
async function autoUploadFilesImmediately(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) return;

  for (let i = 0; i < imageFiles.length; i++) {
    const rawDataUrl = await readFileAsDataURL(imageFiles[i]);
    await processAndAutoSaveSinglePhoto(rawDataUrl, i + 1, imageFiles.length);
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

async function processAndAutoSaveSinglePhoto(rawDataUrl, currentIdx = 1, totalCount = 1) {
  const progressBox = document.getElementById('uploadProgressBox');
  const progressFill = document.getElementById('uploadProgressFill');
  const progressText = document.getElementById('uploadProgressText');
  const successBanner = document.getElementById('uploadSuccessBanner');
  const captionInput = document.getElementById('guestCaptionInput');
  const caption = captionInput ? captionInput.value.trim() : '';

  if (progressBox) progressBox.classList.add('active');
  if (progressFill) progressFill.style.width = '40%';
  if (progressText) {
    progressText.textContent = totalCount > 1
      ? `Guardando foto ${currentIdx} de ${totalCount} automáticamente...`
      : 'Guardando tu foto automáticamente...';
  }

  // 1. Optimización ligera en cliente (máx 1280px, JPEG 0.78 -> ~120KB para subida instantánea)
  const processed = await renderPhotoWithOptionalFrame(rawDataUrl);
  const timestamp = Date.now();
  const fileKey = `${timestamp}_${Math.random().toString(36).slice(2, 7)}`;
  const fileName = `Boda_Fernando_y_Luisa_${fileKey}.jpg`;

  // 2. Mostrar la foto INMEDIATAMENTE en el Mural en Vivo (UI Optimista Instantánea)
  const optimisticItem = {
    key: fileKey,
    photoUrl: processed.dataUrl,
    caption: caption,
    createdAt: new Date().toISOString()
  };
  AppState.galleryPhotos.unshift(optimisticItem);
  renderGalleryItemsToDOM(AppState.galleryPhotos);

  if (progressFill) progressFill.style.width = '85%';

  // 3. Subir a Supabase Storage (Mural en Vivo) y a Google Drive EN PARALELO
  const storagePath = `fotos/${fileKey}.jpg`;
  const publicPhotoUrl = `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/${storagePath}`;

  const uploadToSupabasePromise = (async () => {
    await fetch(
      `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/${WEDDING_CONFIG.supabaseBucket}/${storagePath}`,
      {
        method: 'POST',
        headers: {
          apikey: WEDDING_CONFIG.supabaseStorageKey,
          Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: processed.blob
      }
    );

    if (caption) {
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
          body: JSON.stringify({
            id: fileKey,
            fileName,
            caption,
            photoUrl: publicPhotoUrl,
            createdAt: new Date().toISOString()
          })
        }
      );
    }
  })();

  // Envío directo a Google Drive en segundo plano sin bloquear la pantalla del invitado
  sendPhotoToGoogleDriveFolder({
    base64DataUrl: processed.dataUrl,
    fileName,
    caption,
    publicPhotoUrl
  });

  // Esperar solo la subida rápida al mural (~0.5s) para mostrar éxito inmediato
  try {
    await uploadToSupabasePromise;
    optimisticItem.photoUrl = publicPhotoUrl;
  } catch (e) {
    console.warn('Subida en segundo plano:', e);
  }

  if (progressFill) progressFill.style.width = '100%';
  setTimeout(() => {
    if (progressBox) progressBox.classList.remove('active');
    if (progressFill) progressFill.style.width = '0%';
  }, 250);

  if (captionInput && currentIdx === totalCount) {
    captionInput.value = '';
  }

  if (successBanner) {
    successBanner.classList.add('active');
  }
  showToast('✨ ¡Foto guardada automáticamente!');
}

async function renderPhotoWithOptionalFrame(rawDataUrl) {
  const includeWatermark = document.getElementById('chkWeddingWatermark')?.checked ?? true;
  const img = await loadImageElement(rawDataUrl);

  // 1280px mantiene nitidez excelente en celulares y reduce el peso 4x para subida instantánea
  const maxDim = 1280;
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

  const footerHeight = includeWatermark ? Math.max(Math.round(h * 0.105), 76) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h + footerHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0, w, h);

  if (includeWatermark) {
    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, h, w, footerHeight);

    const grad = ctx.createLinearGradient(0, h, w, h);
    grad.addColorStop(0, '#9e7a32');
    grad.addColorStop(0.5, '#e4c88a');
    grad.addColorStop(1, '#9e7a32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h, w, Math.max(3, Math.round(footerHeight * 0.04)));

    const titleSize = Math.max(18, Math.round(footerHeight * 0.38));
    ctx.font = `600 ${titleSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = '#3a472c';
    ctx.textAlign = 'center';
    ctx.fillText('Fernando & Luisa Fernanda', w / 2, h + Math.round(footerHeight * 0.50));

    const subSize = Math.max(10, Math.round(footerHeight * 0.21));
    ctx.font = `600 ${subSize}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = '#8f6e2b';
    ctx.fillText('NUESTRA BODA • 14 • NOVIEMBRE • 2026 • IBAGUÉ', w / 2, h + Math.round(footerHeight * 0.82));
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
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

// Envía la foto a la carpeta Google Drive (1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci) en segundo plano
function sendPhotoToGoogleDriveFolder({ base64DataUrl, fileName, caption, publicPhotoUrl }) {
  const base64Clean = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
  const payload = {
    action: 'uploadPhoto',
    folderId: WEDDING_CONFIG.driveFolderId,
    fileName,
    mimeType: 'image/jpeg',
    base64: base64Clean,
    guestName: 'Invitado Boda',
    caption: caption || '',
    publicPhotoUrl
  };

  fetch(AppState.driveScriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// ==========================================================================
// MURAL EN VIVO DE LA BODA (CARGA RÁPIDA EN TIEMPO REAL)
// ==========================================================================
window.loadLiveWeddingGallery = async function (showNotification = false) {
  const grid = document.getElementById('weddingGalleryGrid');
  if (!grid) return;

  try {
    const [fotosRes, metaListRes] = await Promise.all([
      fetch(`${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/list/${WEDDING_CONFIG.supabaseBucket}`, {
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
      }),
      fetch(`${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/list/${WEDDING_CONFIG.supabaseBucket}`, {
        method: 'POST',
        headers: {
          apikey: WEDDING_CONFIG.supabaseStorageKey,
          Authorization: `Bearer ${WEDDING_CONFIG.supabaseStorageKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prefix: 'meta/',
          limit: 100,
          offset: 0
        })
      })
    ]);

    if (!fotosRes.ok) return;
    const files = (await fotosRes.json()).filter(f => f.name && f.name.endsWith('.jpg'));
    const metaFiles = metaListRes.ok ? await metaListRes.json() : [];
    const hasMetaSet = new Set(metaFiles.map(m => m.name));

    const items = await Promise.all(
      files.map(async (f) => {
        const key = f.name.replace(/\.jpg$/, '');
        const photoUrl = `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/fotos/${f.name}`;
        let caption = '';

        // Solo descargar JSON de meta si realmente existe (evita peticiones innecesarias)
        if (hasMetaSet.has(`${key}.json`)) {
          try {
            const metaRes = await fetch(
              `${WEDDING_CONFIG.supabaseUrl}/storage/v1/object/public/${WEDDING_CONFIG.supabaseBucket}/meta/${key}.json`
            );
            if (metaRes.ok) {
              const meta = await metaRes.json();
              caption = meta.caption || '';
            }
          } catch (_) {}
        }

        return { key, photoUrl, caption, createdAt: f.created_at };
      })
    );

    AppState.galleryPhotos = items;
    renderGalleryItemsToDOM(items);

    if (showNotification) {
      showToast('✓ Mural de fotos actualizado');
    }
  } catch (err) {
    console.warn('Error cargando mural:', err);
  }
};

function renderGalleryItemsToDOM(items) {
  const grid = document.getElementById('weddingGalleryGrid');
  const badge = document.getElementById('galleryCountBadge');
  if (!grid) return;

  if (badge) {
    badge.textContent = items.length === 0
      ? 'Sé el primero en inaugurar el álbum ✨'
      : `${items.length} ${items.length === 1 ? 'Recuerdo compartido' : 'Recuerdos compartidos'}`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="gallery-empty-state">
        <div style="font-size: 2rem; margin-bottom: 8px;">📸</div>
        <div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: var(--color-olive-dark);">
          ¡Inaugura el Álbum de Fernando & Luisa Fernanda!
        </div>
        <p style="font-size: 0.82rem; margin-top: 4px;">
          Toma la primera foto con el botón de arriba y aparecerá aquí al instante.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gallery-polaroid-item';
    card.onclick = () => openPhotoLightbox(index);

    const safeCaption = escapeHtml(item.caption);

    card.innerHTML = `
      <div class="gallery-img-wrap">
        <img src="${item.photoUrl}" alt="Recuerdo de la boda" loading="lazy">
      </div>
      ${safeCaption ? `
        <div class="gallery-meta">
          <div class="gallery-guest-caption">“${safeCaption}”</div>
        </div>
      ` : ''}
    `;
    grid.appendChild(card);
  });
}

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
  if (author) author.textContent = 'Fernando & Luisa Fernanda';
  if (caption) caption.textContent = item.caption ? `“${item.caption}”` : 'Recuerdo de Nuestra Boda • 14.11.2026';
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
  return 'https://qrboda.vercel.app';
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
    text: urlText || 'https://qrboda.vercel.app',
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

  const val = urlInput.value.trim() || 'https://qrboda.vercel.app';
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

window.downloadLuxuryQrCardPNG = async function () {
  const qrCanvas = document.querySelector('#qrcodeContainer canvas');
  if (!qrCanvas) return;

  const canvas = document.createElement('canvas');
  const W = 1200;
  const H = 1680;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fdfcf9';
  ctx.fillRect(0, 0, W, H);
  try {
    const bgImg = await loadImageElement('assets/card_background.jpg');
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch (_) {}

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 6;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.strokeStyle = 'rgba(197, 160, 89, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(68, 68, W - 136, H - 136);
  ctx.setLineDash([]);

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

  ctx.fillStyle = '#3a472c';
  ctx.font = '700 54px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('📸 ¡Escanea y Comparte tus Fotos!', W / 2, 1325);

  ctx.fillStyle = '#5f6a54';
  ctx.font = '500 28px "Montserrat", sans-serif';
  ctx.fillText('Apunta con la cámara de tu celular a este código QR', W / 2, 1385);
  ctx.fillText('para tomar fotos y compartirlas en nuestro álbum de boda.', W / 2, 1428);

  ctx.fillStyle = '#8f6e2b';
  ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('“Gracias por capturar junto a nosotros los recuerdos de nuestro para siempre”', W / 2, 1525);

  const link = document.createElement('a');
  link.download = 'Tarjeta_QR_Mesa_Boda_Fernando_y_Luisa.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast('🖼️ ¡Tarjeta QR de lujo descargada en alta resolución!');
};

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
  setTimeout(() => toast.classList.remove('show'), 2800);
}
