document.addEventListener('DOMContentLoaded', () => {

  const WHATSAPP_NUMBER = '5493511234567';
  const WHATSAPP_MESSAGE = 'Hola! Quiero saber más sobre Juventud CBA';

  const lockScreen = document.getElementById('lock-screen');
  const siteContent = document.getElementById('site-content');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userStatus = document.getElementById('user-status');

  function showSite(user) {
    lockScreen.style.display = 'none';
    siteContent.style.display = 'block';
    userStatus.textContent = `Conectado como ${user.user_metadata.full_name || user.email}`;
  }

  function showLock() {
    lockScreen.style.display = 'flex';
    siteContent.style.display = 'none';
  }

  if (window.netlifyIdentity) {
    netlifyIdentity.init();

    netlifyIdentity.on('init', user => {
      if (user) {
        showSite(user);
      } else {
        showLock();
      }
    });

    netlifyIdentity.on('login', user => {
      showSite(user);
      netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
      showLock();
    });

    loginBtn.addEventListener('click', () => {
      netlifyIdentity.open();
    });

    logoutBtn.addEventListener('click', () => {
      netlifyIdentity.logout();
    });
  }

  // --- Botón de WhatsApp ---
  const btnWhatsapp = document.querySelector('.btn-whatsapp');
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      const encodedMsg = encodeURIComponent(WHATSAPP_MESSAGE);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`, '_blank');
    });
  }

});