const PHOTOS_BUCKET = 'photos';

async function loadPhotos(approvedOnly = true) {
  let query = supabase.from('photos').select('*').order('created_at', { ascending: false });
  if (approvedOnly) query = query.eq('approved', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function uploadPhoto(file, description) {
  const ext = file.name.split('.').pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(path);

  const { data, error: dbError } = await supabase
    .from('photos')
    .insert({ url: publicUrl, description, uploaded_by: currentUser.id })
    .select()
    .single();
  if (dbError) throw dbError;
  return data;
}

async function approvePhoto(id) {
  const { error } = await supabase.from('photos').update({ approved: true }).eq('id', id);
  if (error) throw error;
}

async function deletePhoto(id, url) {
  const path = url.split('/photos/')[1];
  if (path) await supabase.storage.from(PHOTOS_BUCKET).remove([path]);
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) throw error;
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
      ${editable ? `<button class="photo-delete" data-id="${photo.id}" data-url="${photo.url}"><i class="ti ti-trash"></i></button>` : ''}
    `;
    grid.appendChild(item);
  });

  container.appendChild(grid);

  if (editable) {
    container.querySelectorAll('.photo-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta foto?')) return;
        try {
          await deletePhoto(btn.dataset.id, btn.dataset.url);
          btn.closest('.photo-item').remove();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
}
