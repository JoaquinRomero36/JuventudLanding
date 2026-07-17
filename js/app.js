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
