function showLockScreen() {
  document.querySelector('#lock-screen').style.display = 'flex';
}

function hideLockScreen() {
  document.querySelector('#lock-screen').style.display = 'none';
}

function closeModal() {
  document.querySelector('#auth-modal').style.display = 'none';
}

async function renderHomeGallery(container) {
  try {
    const photos = await loadPhotos(true);
    renderPhotoGallery(container, photos.slice(0, 6));
  } catch (err) {
    container.innerHTML = `<p class="error">Error al cargar galería: ${err.message}</p>`;
  }
}

async function renderGalleryPage(container) {
  container.innerHTML = `
    <h1 class="page-title">Galería de fotos</h1>
    <div id="full-gallery"></div>
  `;
  const galleryContainer = container.querySelector('#full-gallery');
  try {
    const photos = await loadPhotos(true);
    renderPhotoGallery(galleryContainer, photos);
  } catch (err) {
    galleryContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}
