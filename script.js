document.addEventListener('DOMContentLoaded', async () => {

  const lockScreen = document.getElementById('lock-screen');
  const authModal = document.getElementById('auth-modal');
  const authModalContent = document.getElementById('auth-modal-content');
  const showAuthBtn = document.getElementById('show-auth-btn');

  showAuthBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    renderAuthForm(authModalContent);
  });

  authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
  });

  const session = await checkSession();
  if (session) {
    await renderApp();
  }

  document.addEventListener('click', (e) => {
    const whatsappBtn = e.target.closest('.btn-whatsapp');
    if (whatsappBtn) {
      const msg = encodeURIComponent('Hola! Quiero saber más sobre Juventud CBA');
      window.open(`https://wa.me/5493511234567?text=${msg}`, '_blank');
    }
  });

});
