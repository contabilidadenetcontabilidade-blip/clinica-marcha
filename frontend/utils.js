// Utilitários compartilhados

function showLoading(elementId, message = 'Carregando...') {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `<li style="text-align: center; padding: 20px; color: #666;">${message}</li>`;
  }
}

function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
  
  // Remove toast antigo se existir
  const existingToasts = document.querySelectorAll('.toast');
  if (existingToasts.length > 1) {
    existingToasts[0].remove();
  }
}

function showSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
  
  // Remove toast antigo se existir
  const existingToasts = document.querySelectorAll('.toast');
  if (existingToasts.length > 1) {
    existingToasts[0].remove();
  }
}

function setButtonLoading(button, isLoading, originalText = null) {
  if (!originalText) {
    originalText = button.textContent;
    button.dataset.originalText = originalText;
  }
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Carregando...' : originalText;
}

// Adiciona estilos de toast se não existirem
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      max-width: 300px;
    }

    .toast-success {
      background: #4caf50;
    }

    .toast-error {
      background: #f44336;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}



