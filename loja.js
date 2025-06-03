// Sistema de Progresso
const progresso = JSON.parse(localStorage.getItem('progresso')) || {
  gemas: 0,
  skinsCompradas: ['classico'],
  skinAtiva: 'classico',
  powerUps: {
    minaDourada: false,
    vidasExtras: 0
  }
};

// Função para transição entre páginas
function transitionToPage(url) {
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// Atualiza UI da loja
function atualizarLoja() {
  document.getElementById('saldo-gemas').textContent = progresso.gemas;
  document.getElementById('qtd-vidas').textContent = progresso.powerUps.vidasExtras;
  
  document.querySelectorAll('.item-loja').forEach(item => {
    const id = item.dataset.id;
    const btn = item.querySelector('button');
    
    if (id) {
      const comprado = progresso.skinsCompradas.includes(id) || 
                      (id === 'vida-extra' && progresso.powerUps.vidasExtras > 0) ||
                      (id === 'mina-dourada' && progresso.powerUps.minaDourada);
      
      if (comprado) {
        if (id === 'classico' || id === 'neon' || id === 'espaco' || id === 'retro') {
          item.querySelector('.preco').textContent = 'Comprado';
          const emUso = progresso.skinAtiva === id;
          btn.textContent = emUso ? 'Usando' : 'Usar';
          btn.className = emUso ? 'btn-usar' : 'btn-comprar';
          btn.onclick = emUso ? null : () => selecionarSkin(id);
        } else {
          btn.textContent = 'Comprado';
          btn.className = 'btn-usar';
          btn.onclick = null;
        }
      } else {
        btn.onclick = () => comprarItem(id, Number(item.dataset.preco));
      }
    }
  });
}

// Compra de itens
function comprarItem(id, preco) {
  if (progresso.gemas >= preco) {
    progresso.gemas -= preco;
    
    if (id === 'vida-extra') {
      progresso.powerUps.vidasExtras = (progresso.powerUps.vidasExtras || 0) + 1;
    } else if (id === 'mina-dourada') {
      progresso.powerUps.minaDourada = true;
    } else {
      progresso.skinsCompradas.push(id);
    }
    
    localStorage.setItem('progresso', JSON.stringify(progresso));
    atualizarLoja();
    mostrarFeedback(`Compra realizada!`, 'sucesso');
  } else {
    mostrarFeedback('Gemas insuficientes!', 'erro');
  }
}

// Seleção de skin
function selecionarSkin(id) {
  progresso.skinAtiva = id;
  localStorage.setItem('progresso', JSON.stringify(progresso));
  atualizarLoja();
  mostrarFeedback(`Skin ${id} aplicada!`, 'sucesso');
}

// Feedback de compra
function mostrarFeedback(mensagem, tipo) {
  const feedback = document.getElementById('feedbackCompra');
  feedback.textContent = mensagem;
  feedback.className = `feedback-compra ${tipo}`;
  
  setTimeout(() => {
    feedback.className = 'feedback-compra';
  }, 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  atualizarLoja();
  
  // Configura eventos dos botões de voltar
  document.querySelectorAll('.btn-voltar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      transitionToPage('index.html'); // Redireciona diretamente para index.html
    });
  });
});