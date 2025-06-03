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
  contadorVidas: document.getElementById("contador-vidas")
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
let estado = {
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
    vidasExtras: 0
  }
};

// Funções Principais
function atualizarUI() {
  elementos.saldoEl.textContent = estado.saldo.toFixed(2);
  elementos.lucroEl.textContent = estado.lucro.toFixed(2);
  elementos.multiplicadorEl.textContent = estado.multiplicador.toFixed(2) + "x";
  elementos.contadorVidas.textContent = progresso.powerUps.vidasExtras;
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
    mostrarResultado("Aposta inválida!", "erro");
    return;
  }

  estado.saldo -= aposta;
  estado.bombas = gerarBombas(parseInt(elementos.bombasSelect.value));
  estado.clicadas = [];
  estado.multiplicador = config.multiplicadorBase;
  estado.lucro = 0;
  estado.emJogo = true;

  elementos.retirarBtn.disabled = false;
  elementos.iniciarBtn.disabled = true;

  criarGrade();
  if (somAtivo) sons.inicio.play();
  atualizarUI();
}

function clicarCarta(index, elemento) {
  if (!estado.emJogo || estado.clicadas.includes(index)) return;

  const imagem = elemento.querySelector('.carta-imagem');
  
  if (estado.bombas.includes(index)) {
    // Verifica se tem vida extra
    if (progresso.powerUps.vidasExtras > 0) {
      progresso.powerUps.vidasExtras--;
      localStorage.setItem('progresso', JSON.stringify(progresso));
      
      // Efeito visual de vida usada
      imagem.src = "bomba_padrao.png";
      imagem.style.display = "block";
      if (somAtivo) sons.vida.play();
      mostrarResultado("Vida extra usada!", "aviso");
      
      // Marca como clicada mas não termina o jogo
      estado.clicadas.push(index);
      atualizarUI();
    } else {
      // Efeito de explosão
      elemento.classList.add("erro");
      imagem.src = "bomba_padrao.png";
      imagem.style.display = "block";
      if (somAtivo) sons.explosao.play();
      adicionarAoHistorico(false);
      fimDeJogo(false);
    }
  } else {
    elemento.classList.add("acerto");
    imagem.src = "moeda_padrao.png";
    imagem.style.display = "block";
    if (somAtivo) sons.acerto.play();
    estado.clicadas.push(index);
    
    // Verifica mina dourada
    const multiplicadorExtra = (progresso.powerUps.minaDourada && Math.random() < 0.05) ? 5 : 1;
    estado.multiplicador += config.incrementoPorAcerto * multiplicadorExtra;
    
    estado.lucro = parseFloat(elementos.apostaInput.value) * estado.multiplicador;
    atualizarUI();
  }
}

function retirar() {
  if (!estado.emJogo) return;
  
  estado.saldo += parseFloat(elementos.apostaInput.value) + estado.lucro;
  
  // Dar gemas proporcional ao lucro
  const gemasGanhas = Math.floor(estado.lucro * 0.1);
  progresso.gemas += gemasGanhas;
  localStorage.setItem('progresso', JSON.stringify(progresso));
  
  if (somAtivo) sons.retirada.play();
  adicionarAoHistorico(true);
  fimDeJogo(true);
}

function fimDeJogo(vitoria) {
  estado.emJogo = false;
  elementos.iniciarBtn.disabled = false;
  elementos.retirarBtn.disabled = true;
  
  if (!vitoria) {
    mostrarBombas();
    mostrarResultado("Game Over!", "derrota");
    estado.lucro = 0;
  } else {
    mostrarResultado(`Você ganhou R$${estado.lucro.toFixed(2)} + ${Math.floor(estado.lucro * 0.1)} gemas!`, "vitoria");
  }
  atualizarUI();
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

// Aplicar skin ao iniciar
function aplicarSkin() {
  document.body.className = `skin-${progresso.skinAtiva}`;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function() {
  aplicarSkin();
  elementos.iniciarBtn.addEventListener("click", iniciarJogo);
  elementos.retirarBtn.addEventListener("click", retirar);
  elementos.limparHistoricoBtn.addEventListener("click", limparHistorico);
  atualizarUI();
});