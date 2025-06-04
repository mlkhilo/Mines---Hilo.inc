// Configurações
const somAtivo = localStorage.getItem("somAtivo") !== "false";
const config = {
  multiplicadorBase: 1.0,
  incrementoPorAcerto: 0.3,
  maxHistorico: 10
};

// Elementos
const elementos = {
  grid: document.getElementById("grid"),
  iniciarBtn: document.getElementById("iniciar"),
  retirarBtn: document.getElementById("retirar"),
  saldoEl: document.getElementById("saldo"),
  lucroEl: document.getElementById("lucro"),
  multiplicadorEl: document.getElementById("multiplicador"),
  bombasSelect: document.getElementById("bombas"),
  apostaInput: document.getElementById("aposta"),
  historicoEl: document.getElementById("historico"),
  limparHistoricoBtn: document.getElementById("limparHistorico"),
  resultadoOverlay: document.getElementById("resultadoOverlay"),
  contadorVidas: document.getElementById("contador-vidas"),
  contadorVisao: document.getElementById("contador-visao"),
  btnVisaoAguia: document.getElementById("btn-visao-aguia")
};

// Sons
const sons = {
  acerto: document.getElementById("somAcerto"),
  erro: document.getElementById("somErro"),
  retirada: document.getElementById("somRetirada"),
  inicio: document.getElementById("somInicio"),
  explosao: document.getElementById("somExplosao"),
  vida: document.getElementById("somVida")
};

// Estado do Jogo
let estado = JSON.parse(localStorage.getItem('estadoJogo')) || {
  bombas: [],
  clicadas: [],
  multiplicador: config.multiplicadorBase,
  saldo: 100,
  lucro: 0,
  emJogo: false,
  historico: []
};

// Progresso do Jogador
let progresso = JSON.parse(localStorage.getItem('progresso')) || {
  gemas: 0,
  skinsCompradas: ['classico'],
  skinAtiva: 'classico',
  powerUps: {
    minaDourada: false,
    vidasExtras: 0,
    visaoAguia: 0
  }
};

// Funções Auxiliares
function vibrar() {
  if ("vibrate" in navigator) {
    navigator.vibrate(200);
  }
}

function mostrarFeedback(mensagem, tipo) {
  const feedback = document.createElement('div');
  feedback.className = `feedback-flutuante ${tipo}`;
  feedback.textContent = mensagem;
  document.body.appendChild(feedback);
  
  setTimeout(() => feedback.remove(), 2000);
}

// Funções Principais
function atualizarUI() {
  elementos.saldoEl.textContent = estado.saldo.toFixed(2);
  elementos.lucroEl.textContent = estado.lucro.toFixed(2);
  elementos.multiplicadorEl.textContent = estado.multiplicador.toFixed(2) + "x";
  elementos.contadorVidas.textContent = progresso.powerUps.vidasExtras;
  elementos.contadorVisao.textContent = progresso.powerUps.visaoAguia;
  elementos.btnVisaoAguia.style.display = progresso.powerUps.visaoAguia > 0 ? 'flex' : 'none';
  elementos.btnVisaoAguia.setAttribute('data-count', progresso.powerUps.visaoAguia);
}

function gerarBombas(qtd) {
  const total = 25;
  const indices = new Set();
  while (indices.size < qtd) {
    indices.add(Math.floor(Math.random() * total));
  }
  return Array.from(indices);
}

function criarGrade() {
  elementos.grid.innerHTML = "";
  for (let i = 0; i < 25; i++) {
    const carta = document.createElement("div");
    carta.className = "carta";
    carta.dataset.index = i;
    
    const conteudo = document.createElement("div");
    conteudo.className = "carta-conteudo";
    
    const imagem = document.createElement("img");
    imagem.className = "carta-imagem";
    imagem.style.display = "none";
    conteudo.appendChild(imagem);
    
    carta.appendChild(conteudo);
    carta.addEventListener("click", () => clicarCarta(i, carta));
    elementos.grid.appendChild(carta);
  }
}

function iniciarJogo() {
  const aposta = parseFloat(elementos.apostaInput.value);
  if (aposta > estado.saldo || aposta <= 0) {
    mostrarFeedback("Aposta inválida!", "erro");
    return;
  }

  estado.bombas = gerarBombas(parseInt(elementos.bombasSelect.value));
  estado.clicadas = [];
  estado.multiplicador = config.multiplicadorBase;
  estado.lucro = 0;
  estado.emJogo = true;
  estado.saldo -= aposta;

  elementos.retirarBtn.disabled = false;
  elementos.iniciarBtn.disabled = true;

  criarGrade();
  if (somAtivo) sons.inicio.play();
  atualizarUI();
}

function retirar() {
  if (!estado.emJogo) {
    mostrarFeedback("Nenhum jogo ativo para retirar!", "erro");
    return;
  }

  if (estado.clicadas.length === 0) {
    mostrarFeedback("Clique em pelo menos 1 carta antes de retirar!", "erro");
    return;
  }

  const valorGanho = parseFloat((parseFloat(elementos.apostaInput.value) * estado.multiplicador).toFixed(2));
  estado.saldo += parseFloat(valorGanho);
  estado.lucro = parseFloat(valorGanho);
  
  // Finaliza o jogo
  estado.emJogo = false;
  elementos.retirarBtn.disabled = true;
  elementos.iniciarBtn.disabled = false;
  
  // Adiciona gemas
  const gemasGanhas = Math.floor(estado.lucro * 0.1);
  progresso.gemas += gemasGanhas;
  
  // Salva e atualiza
  localStorage.setItem('progresso', JSON.stringify(progresso));
  localStorage.setItem('estadoJogo', JSON.stringify(estado));
  
  // Feedback
  if (somAtivo) sons.retirada.play();
  mostrarResultado(`Você retirou R$${valorGanho}! (+${gemasGanhas} gemas)`, "vitoria");
  adicionarAoHistorico(true);
  atualizarUI();
}

function clicarCarta(index, elemento) {
  if (!estado.emJogo || estado.clicadas.includes(index)) return;

  const imagem = elemento.querySelector('.carta-imagem');
  
  if (estado.bombas.includes(index)) {
    if (progresso.powerUps.vidasExtras > 0) {
      progresso.powerUps.vidasExtras--;
      localStorage.setItem('progresso', JSON.stringify(progresso));
      
      imagem.src = "bomba_padrao.png";
      imagem.style.display = "block";
      elemento.classList.add("erro");
      vibrar();
      
      if (somAtivo) sons.vida.play();
      mostrarFeedback("Vida extra usada!", "aviso");
      
      estado.clicadas.push(index);
      atualizarUI();
    } else {
      // Efeitos visuais
      elemento.classList.add("erro");
      const explosao = document.createElement('div');
      explosao.className = 'explosao';
      elemento.appendChild(explosao);
      
      // Mostra a bomba
      imagem.src = "bomba_padrao.png";
      imagem.style.display = "block";
      
      // Feedback
      vibrar();
      if (somAtivo) sons.explosao.play();
      
      // Remove explosão após animação
      setTimeout(() => explosao.remove(), 500);
      
      // Finaliza o jogo após delay
      setTimeout(() => {
        estado.emJogo = false;
        elementos.retirarBtn.disabled = true;
        elementos.iniciarBtn.disabled = false;
        
        mostrarBombas();
        mostrarResultado("Game Over!", "derrota");
        adicionarAoHistorico(false);
        atualizarUI();
      }, 800);
    }
  } else {
    elemento.classList.add("acerto");
    
    // Verifica se ativou Mina Dourada
    const minaDouradaAtivada = progresso.powerUps.minaDourada && Math.random() < 0.05;
    
    // Define a imagem e o multiplicador
    if (minaDouradaAtivada) {
      imagem.src = "mina_dourada.png";
      estado.multiplicador += 5; // Adiciona 5x diretamente ao multiplicador
      mostrarFeedback("MINA DOURADA! +5x multiplicador", "sucesso");
    } else {
      imagem.src = "moeda_padrao.png";
      estado.multiplicador += config.incrementoPorAcerto; // Incremento normal
    }
    
    imagem.style.display = "block";
    imagem.classList.add("moeda-girando");
    
    setTimeout(() => imagem.classList.remove("moeda-girando"), 500);
    
    if (somAtivo) sons.acerto.play();
    estado.clicadas.push(index);
    estado.lucro = parseFloat(elementos.apostaInput.value) * estado.multiplicador;
    atualizarUI();
  }
}

function mostrarBombas() {
  document.querySelectorAll(".carta").forEach((carta, index) => {
    if (estado.bombas.includes(index) && !estado.clicadas.includes(index)) {
      const imagem = carta.querySelector('.carta-imagem');
      carta.classList.add("erro");
      imagem.src = "bomba_padrao.png";
      imagem.style.display = "block";
    }
  });
}

function mostrarResultado(mensagem, tipo) {
  const conteudo = elementos.resultadoOverlay.querySelector(".resultado-conteudo");
  conteudo.innerHTML = `<h2>${mensagem}</h2>`;
  elementos.resultadoOverlay.className = `resultado-overlay ${tipo}`;
  elementos.resultadoOverlay.style.display = "flex";
  
  setTimeout(() => {
    elementos.resultadoOverlay.style.display = "none";
  }, 2000);
}

function adicionarAoHistorico(vitoria) {
  const entrada = {
    tipo: vitoria ? "vitoria" : "derrota",
    multiplicador: estado.multiplicador.toFixed(2),
    valor: vitoria ? estado.lucro.toFixed(2) : "0.00",
    data: new Date().toLocaleTimeString()
  };
  
  estado.historico.unshift(entrada);
  if (estado.historico.length > config.maxHistorico) {
    estado.historico.pop();
  }
  
  atualizarHistorico();
}

function atualizarHistorico() {
  elementos.historicoEl.innerHTML = estado.historico.map(entrada => `
    <div class="historico-item ${entrada.tipo}">
      <span class="historico-tipo">${entrada.tipo === "vitoria" ? "🏆" : "💣"}</span>
      <span class="historico-multiplicador">${entrada.multiplicador}x</span>
      <span class="historico-valor">R$${entrada.valor}</span>
      <span class="historico-data">${entrada.data}</span>
    </div>
  `).join("");
}

function limparHistorico() {
  estado.historico = [];
  atualizarHistorico();
}

function ativarVisaoAguia() {
  if (!estado.emJogo || progresso.powerUps.visaoAguia <= 0) {
    mostrarFeedback("Sem visões disponíveis!", "erro");
    return;
  }

  progresso.powerUps.visaoAguia--;
  localStorage.setItem('progresso', JSON.stringify(progresso));
  atualizarUI();
  
  mostrarBombas();
  setTimeout(() => {
    if (estado.emJogo) {
      document.querySelectorAll('.carta').forEach(carta => {
        const idx = parseInt(carta.dataset.index);
        if (estado.bombas.includes(idx) && !estado.clicadas.includes(idx)) {
          carta.querySelector('.carta-imagem').style.display = 'none';
        }
      });
    }
  }, 3000);
}

function aplicarSkin() {
  document.body.className = `skin-${progresso.skinAtiva}`;
}

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
  aplicarSkin();
  
  // Carrega estado salvo
  const estadoSalvo = localStorage.getItem('estadoJogo');
  if (estadoSalvo) estado = JSON.parse(estadoSalvo);
  
  const progressoSalvo = localStorage.getItem('progresso');
  if (progressoSalvo) progresso = JSON.parse(progressoSalvo);

  // Configura eventos
  elementos.iniciarBtn.addEventListener("click", iniciarJogo);
  elementos.retirarBtn.addEventListener("click", retirar);
  elementos.limparHistoricoBtn.addEventListener("click", limparHistorico);
  elementos.btnVisaoAguia.addEventListener('click', ativarVisaoAguia);
  
  // Garante estado inicial correto
  elementos.retirarBtn.disabled = true;
  elementos.iniciarBtn.disabled = false;
  
  atualizarUI();
});