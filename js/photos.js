async function loadPhotos(approvedOnly = true) {
  const params = approvedOnly ? '?onlyApproved=true' : '';
  return apiFetch(`/photos${params}`);
}

async function uploadPhoto(file, description) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const photo = await apiFetch('/photos', {
          method: 'POST',
          body: JSON.stringify({ file: base64, fileName: file.name, description })
        });
        resolve(photo);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer la imagen'));
    reader.readAsDataURL(file);
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
