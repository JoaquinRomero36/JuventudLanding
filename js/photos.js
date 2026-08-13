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

async function setPhotoFeatured(id, featured) {
  return apiFetch('/photos/featured', {
    method: 'PUT',
    body: JSON.stringify({ id, featured })
  });
}

async function reorderPhotos(ids) {
  return apiFetch('/photos/order', {
    method: 'PUT',
    body: JSON.stringify({ ids })
  });
}

async function deletePhoto(id) {
  return apiFetch(`/photos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

function renderPhotoGallery(container, photos, editable = false) {
  container.innerHTML = '';
  if (photos.length === 0) {
    container.innerHTML = emptyState('ti-photo', 'Todavía no hay fotos. Subí la primera del próximo encuentro.');
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  photos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'photo-item' + (i === 0 ? ' photo-featured' : '');
    const safeDesc = escapeHtml(photo.description || '');
    const w = photo.width || 1200;
    const h = photo.height || 800;
    item.style.aspectRatio = `${w} / ${h}`;
    item.style.animationDelay = Math.min(i * 60, 600) + 'ms';
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', safeDesc ? `Ver foto: ${safeDesc}` : 'Ver foto');
    item.innerHTML = `
      <img src="${photo.url}" alt="${safeDesc || 'Foto'}" loading="lazy" decoding="async">
      <div class="photo-overlay">
        <div class="photo-overlay-inner">
          <span class="photo-overlay-icon"><i class="ti ti-zoom-in"></i></span>
          ${safeDesc ? `<span class="photo-overlay-desc">${safeDesc}</span>` : ''}
        </div>
      </div>
      ${editable ? `<button class="photo-delete" data-id="${photo.id}"><i class="ti ti-trash"></i></button>` : ''}
    `;
    const imgEl = item.querySelector('img');
    const fadeIn = () => imgEl.classList.add('loaded');
    if (imgEl.complete) fadeIn();
    else imgEl.addEventListener('load', fadeIn);
    const openViaClick = (e) => {
      if (e.target.closest('.photo-delete')) return;
      openLightbox(photos, i, item);
    };
    item.addEventListener('click', openViaClick);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openViaClick(e);
      }
    });
    grid.appendChild(item);
  });
  container.appendChild(grid);
  if (editable) {
    container.querySelectorAll('.photo-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!(await confirmDialog('¿Eliminar esta foto?', { confirmText: 'Eliminar', danger: true }))) return;
        try {
          await deletePhoto(btn.dataset.id);
          btn.closest('.photo-item').remove();
          showToast('Foto eliminada', 'success');
        } catch (err) { showToast(apiErrorMessage(err), 'error'); }
      });
    });
  }
}

function openLightbox(photos, index, trigger = null) {
  const existing = document.querySelector('.lightbox');
  if (existing) existing.remove();
  if (!photos || !photos.length) return;
  let current = index || 0;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Visor de fotos');

  const img = document.createElement('img');

  const render = () => {
    const photo = photos[current];
    const desc = escapeHtml(photo.description || '');
    img.src = photo.url;
    img.alt = desc || 'Foto';
    counterEl.textContent = (current + 1) + ' / ' + photos.length;
    descEl.textContent = photo.description || '';
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
  };

  lb.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content">
      ${photos.length > 1 ? `<button class="lightbox-nav lightbox-prev" aria-label="Anterior"><i class="ti ti-chevron-left"></i></button>` : ''}
      <figure class="lightbox-figure">
        <div class="lightbox-stage"></div>
        <figcaption class="lightbox-caption">
          <span class="lightbox-count"></span>
          <p class="lightbox-desc"></p>
        </figcaption>
      </figure>
      ${photos.length > 1 ? `<button class="lightbox-nav lightbox-next" aria-label="Siguiente"><i class="ti ti-chevron-right"></i></button>` : ''}
      <button class="lightbox-close" aria-label="Cerrar"><i class="ti ti-x"></i></button>
    </div>
  `;
  lb.querySelector('.lightbox-stage').appendChild(img);
  const counterEl = lb.querySelector('.lightbox-count');
  const descEl = lb.querySelector('.lightbox-desc');
  render();

  document.body.appendChild(lb);
  document.body.style.overflow = 'hidden';

  const prevBtn = lb.querySelector('.lightbox-prev');
  const nextBtn = lb.querySelector('.lightbox-next');
  const nav = (step) => {
    current = (current + step + photos.length) % photos.length;
    render();
  };
  const close = () => {
    lb.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', keyHandler);
    if (trigger && trigger.focus) trigger.focus();
  };
  function keyHandler(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') nav(1);
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'Tab') trapFocus(lb, e);
  }
  lb.querySelector('.lightbox-backdrop').addEventListener('click', close);
  lb.querySelector('.lightbox-close').addEventListener('click', close);
  if (prevBtn) prevBtn.addEventListener('click', () => nav(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => nav(1));
  document.addEventListener('keydown', keyHandler);
  lb.querySelector('.lightbox-close').focus();
}
