async function loadPhotos(approvedOnly = true) {
  const params = approvedOnly ? '?onlyApproved=true' : '';
  return apiFetch(`/photos${params}`);
}

async function uploadPhoto(file, description) {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('description', description || '');
  return apiUpload('/photos', formData);
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
    const safeDesc = escapeHtml(photo.description || '');
    item.innerHTML = `
      <img src="${photo.url}" alt="${safeDesc || 'Foto'}" loading="lazy">
      ${safeDesc ? `<p class="photo-desc">${safeDesc}</p>` : ''}
      ${editable ? `<button class="photo-delete" data-id="${photo.id}"><i class="ti ti-trash"></i></button>` : ''}
    `;
    item.addEventListener('click', (e) => {
      if (e.target.closest('.photo-delete')) return;
      openLightbox(photo.url, safeDesc);
    });
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
        } catch (err) { alert(err.message); }
      });
    });
  }
}

function openLightbox(src, desc) {
  const existing = document.querySelector('.lightbox');
  if (existing) existing.remove();
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content">
      <img src="${src}" alt="${desc || ''}">
      ${desc ? `<p>${desc}</p>` : ''}
      <button class="lightbox-close"><i class="ti ti-x"></i></button>
    </div>
  `;
  document.body.appendChild(lb);
  lb.querySelector('.lightbox-backdrop').addEventListener('click', () => lb.remove());
  lb.querySelector('.lightbox-close').addEventListener('click', () => lb.remove());
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', handler); }
  });
}
