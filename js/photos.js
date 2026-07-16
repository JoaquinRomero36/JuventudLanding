const CLOUD_NAME = 'TU_CLOUD_NAME';
const UPLOAD_PRESET = 'juventud_unsigned';

async function loadPhotos(approvedOnly = true) {
  const params = approvedOnly ? '?onlyApproved=true' : '';
  return apiFetch(`/photos${params}`);
}

async function uploadPhoto(file, description) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const cloudData = await res.json();
  if (!res.ok) throw new Error(cloudData.error?.message || 'Error al subir imagen');

  return apiFetch('/photos', {
    method: 'POST',
    body: JSON.stringify({ url: cloudData.secure_url, description })
  });
}

async function approvePhoto(id) {
  return apiFetch('/photos', {
    method: 'PUT',
    body: JSON.stringify({ id })
  });
}

async function deletePhoto(id) {
  return apiFetch(`/photos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

function renderPhotoGallery(container, photos, editable = false) {
  container.innerHTML = '';

  if (photos.length === 0) {
    container.innerHTML = '<p class="empty">No hay fotos todavía.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'photo-grid';

  photos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.description || 'Foto'}" loading="lazy">
      ${photo.description ? `<p class="photo-desc">${photo.description}</p>` : ''}
      ${editable ? `<button class="photo-delete" data-id="${photo.id}"><i class="ti ti-trash"></i></button>` : ''}
    `;
    grid.appendChild(item);
  });

  container.appendChild(grid);

  if (editable) {
    container.querySelectorAll('.photo-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta foto?')) return;
        try {
          await deletePhoto(btn.dataset.id);
          btn.closest('.photo-item').remove();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
}
