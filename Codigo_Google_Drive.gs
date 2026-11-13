// ============================================================================
// PUENTE OFICIAL GOOGLE DRIVE - BODA FERNANDO & LUISA FERNANDA (14.11.2026)
// Carpeta de Google Drive vinculada:
// https://drive.google.com/drive/folders/1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci?usp=sharing
// ============================================================================
//
// ¿CÓMO ACTIVARLO EN 1 MINUTO PARA QUE LAS FOTOS CAIGAN EN TU GOOGLE DRIVE?
// 1. Abre https://script.google.com/ y haz clic en "Nuevo proyecto".
// 2. Borra lo que haya y pega todo este código.
// 3. Arriba a la derecha haz clic en "Implementar" -> "Nueva implementación".
// 4. En "Seleccionar tipo" elige "Aplicación web".
// 5. En "Ejecutar como" selecciona: "Yo" (tu cuenta de Google).
// 6. En "Quién tiene acceso" selecciona: "Cualquier persona".
// 7. Haz clic en "Implementar", autoriza el permiso de Drive y copia la URL (.../exec).
// 8. Pega esa URL en el botón "Novios" de tu página web (o ejecuta aquí mismo la
//    función `activarSincronizacionAutomaticaCada5Minutos` para que Google copie
//    automáticamente todas las fotos tomadas en la página hacia tu carpeta Drive).
// ============================================================================

const FOLDER_ID = '1FlD83FFBaYZme3_D9JTev4CPBjKWV2ci';
const SUPABASE_URL = 'https://tapusiqdotxhtnyxavta.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcHVzaXFkb3R4aHRueXhhdnRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ1MDg1MSwiZXhwIjoyMTA0MDI2ODUxfQ.2UWWE50nkAojGIihFZRJOD6N7RZ3gkT6t1FqqM3eLF0';

// 1. Recibe cada foto en tiempo real cuando un invitado la toma desde su celular
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(data.folderId || FOLDER_ID);
    const bytes = Utilities.base64Decode(data.base64);
    const fileName = data.fileName || ('Boda_Fernando_y_Luisa_' + Date.now() + '.jpg');
    const blob = Utilities.newBlob(bytes, data.mimeType || 'image/jpeg', fileName);

    const file = folder.createFile(blob);
    file.setDescription(
      'Foto tomada por: ' + (data.guestName || 'Invitado') +
      (data.caption ? ' | Dedicatoria: "' + data.caption + '"' : '')
    );

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
  return ContentService.createTextOutput(
    '✅ Puente Google Drive Activo - Boda Fernando & Luisa Fernanda (Carpeta: ' + FOLDER_ID + ')'
  );
}

// 2. Sincroniza automáticamente cualquier foto subida en la página hacia tu carpeta Drive
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
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY
    },
    payload: JSON.stringify({ prefix: 'fotos/', limit: 500 })
  });

  const list = JSON.parse(res.getContentText());
  let nuevas = 0;

  list.forEach(function (item) {
    if (!item.name || !item.name.endsWith('.jpg')) return;
    const driveName = 'Boda_Fernando_y_Luisa_' + item.name;
    if (existing[driveName]) return;

    const imgUrl = SUPABASE_URL + '/storage/v1/object/public/wedding-photos/fotos/' + item.name;
    const imgBlob = UrlFetchApp.fetch(imgUrl).getBlob().setName(driveName);
    folder.createFile(imgBlob);
    nuevas++;
  });

  Logger.log('Fotos nuevas copiadas a Google Drive: ' + nuevas);
}

// 3. Ejecuta esta función 1 sola vez si quieres que Google revise cada 5 minutos y copie todo a tu Drive
function activarSincronizacionAutomaticaCada5Minutos() {
  ScriptApp.newTrigger('sincronizarTodasLasFotosDeLaBoda')
    .timeBased()
    .everyMinutes(5)
    .create();
  sincronizarTodasLasFotosDeLaBoda();
}

