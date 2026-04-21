// ================= JAVASCRIPT =================

// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config do seu projeto (trocar pelos seus dados)
const firebaseConfig = {
    apiKey: "AIzaSyBp807fMy4JjkBe8QzLCyh55pSmYkTdeQE",
    authDomain: "lista-de-presentes-3796f.firebaseapp.com",
    projectId: "lista-de-presentes-3796f",
    storageBucket: "lista-de-presentes-3796f.firebasestorage.app",
    messagingSenderId: "544116471096",
    appId: "1:544116471096:web:7d61393f5965f3a7313dcd"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guarda item selecionado no modal
let itemSelecionado = null;

// Busca itens no banco
async function carregarItens() {
  const snapshot = await getDocs(collection(db, "itens"));
  const itens = [];

  snapshot.forEach(docSnap => {
    itens.push({ id: docSnap.id, ...docSnap.data() });
  });

  return itens;
}

// Renderiza lista de presentes
async function render() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const itens = await carregarItens();

  itens.forEach(item => {
    const porcentagem = (item.reservado / item.total) * 100;
    const esgotado = item.reservado >= item.total;

    const card = document.createElement("div");
    card.className = `card${esgotado ? ' esgotado' : ''}`;

    const buttonText = esgotado ? 'Indisponível' : 'Reservar';
    const buttonDisabled = esgotado ? ' disabled' : '';
    const buttonClass = esgotado ? ' class="esgotado"' : '';

    card.innerHTML = `
      <img src="${item.img || ''}">
      <h3>${item.nome}</h3>
      <p>${item.reservado}/${item.total}</p>
      <div class="progress"><div class="bar" style="width:${porcentagem}%"></div></div>
      <button${buttonClass} onclick='abrirModal(${JSON.stringify(item)})'${buttonDisabled}>${buttonText}</button>
    `;

    lista.appendChild(card);
  });
}

// Abre modal
window.abrirModal = (item) => {
  itemSelecionado = item;
  document.getElementById("modalTexto").innerText = `Deseja reservar "${item.nome}"?`;
  document.getElementById("modal").style.display = "flex";
};

// Fecha modal
window.fecharModal = () => {
  document.getElementById("modal").style.display = "none";
};

// Confirma reserva
window.confirmarReserva = async () => {
  if (!itemSelecionado) return;

  // Salva a posição atual do scroll antes de renderizar
  const scrollPos = window.scrollY;

  if (itemSelecionado.reservado >= itemSelecionado.total) {
    alert("Este item já está esgotado!");
    fecharModal();
    return;
  }

  const ref = doc(db, "itens", itemSelecionado.id);

  try {
    await updateDoc(ref, {
      reservado: itemSelecionado.reservado + 1
    });

    fecharModal();
    
    // Renderiza novamente
    await render(); 

    // Força o navegador a manter a posição original, ignorando o "pulo" do render
    window.scrollTo({
      top: scrollPos,
      behavior: 'instant' // Usa 'instant' para não brigar com o smooth do CSS
    });

  } catch (error) {
    console.error("Erro ao reservar:", error);
    alert("Erro ao reservar item. Tente novamente.");
  }
};

// Copia chave PIX
window.copiarPix = () => {
  const key = document.getElementById("pixKey").innerText;
  navigator.clipboard.writeText(key);
  alert("Chave PIX copiada!");
};

window.abrirModalRecado = () => {
  document.getElementById("modalRecado").classList.add("show");
};

window.fecharModalRecado = () => {
  document.getElementById("modalRecado").classList.remove("show");
};

// Envia recado
window.enviarRecado = async () => {
  const nome = document.getElementById("nome").value;
  const msg = document.getElementById("mensagem").value;

  if (!nome || !msg) return alert("Preencha tudo");

  await addDoc(collection(db, "recados"), {
    nome,
    mensagem: msg,
    data: new Date()
  });

  document.getElementById("nome").value = "";
  document.getElementById("mensagem").value = "";
  fecharModalRecado();
  renderRecados();
};

// Mostra recados
async function renderRecados() {
  const container = document.getElementById("recados");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "recados"));

  snapshot.forEach(docSnap => {
    const r = docSnap.data();

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${r.nome}</strong><p>${r.mensagem}</p>`;

    container.prepend(div);
  });
}

// Inicializa tudo
render();
renderRecados();
