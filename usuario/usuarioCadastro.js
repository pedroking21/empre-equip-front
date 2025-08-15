"use strict";

const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const idUsuario = params.get("id"); // string | null

  // listeners de UI
  document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "usuarioListar.html";
  });
  document.getElementById("btnLimpar").addEventListener("click", () => {
    document.getElementById("formUsuario").reset();
  });
  document.getElementById("btnCancelar").addEventListener("click", () => {
    window.location.href = "usuarioListar.html";
  });

  // submit
  document.getElementById("formUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvarUsuario(idUsuario);
  });

  // modo edição?
  if (idUsuario) {
    prepararEdicaoUI();
    carregarUsuarioPorId(idUsuario);
  } else {
    document.title = "Cadastro de Usuário";
  }
});

function prepararEdicaoUI() {
  document.getElementById("tituloUsuario").innerText = "Edição de Usuário";
  document.title = "Edição de Usuário";
  document.getElementById("btnCancelar").classList.remove("hidden");
  const btnSalvar = document.getElementById("btnSalvar");
  btnSalvar.textContent = "Atualizar";
}

async function carregarUsuarioPorId(idUsuario) {
  const btnSalvar = document.getElementById("btnSalvar");
  const voltarBtns = document.querySelectorAll(".btn-voltar");
  try {
    // bloqueia durante o carregamento
    btnSalvar.disabled = true;
    voltarBtns.forEach((b) => (b.disabled = true));
    const original = btnSalvar.textContent;
    btnSalvar.textContent = "Carregando...";

    // 1ª tentativa: rota REST /usuario/:id
    let usuario = await fetchUsuarioRest(idUsuario);

    // fallback: rota antiga /lista/usuario?idUsuario=
    if (!usuario) {
      usuario = await fetchUsuarioQuery(idUsuario);
    }

    if (!usuario) {
      alert("Usuário não encontrado.");
      window.location.href = "usuarioListar.html";
      return;
    }

    // preenche
    document.getElementById("nome").value = usuario.nome || "";
    document.getElementById("tipoUsuario").value = usuario.tipoUsuario || "";
    document.getElementById("contato").value = usuario.contato || "";

    btnSalvar.textContent = original;
  } catch (err) {
    console.error("Erro ao carregar usuário:", err);
    alert("Erro ao carregar os dados do usuário.");
    window.location.href = "usuarioListar.html";
  } finally {
    document.getElementById("btnSalvar").disabled = false;
    document.querySelectorAll(".btn-voltar").forEach((b) => (b.disabled = false));
  }
}

async function fetchUsuarioRest(id) {
  try {
    const r = await fetch(`${API_URL}/usuario/${id}`);
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchUsuarioQuery(id) {
  try {
    const r = await fetch(`${API_URL}/lista/usuario?idUsuario=${id}`);
    if (!r.ok) return null;
    const data = await r.json();
    // pode vir objeto (já filtrado) ou array (lista completa)
    if (Array.isArray(data)) {
      return data.find((u) => String(u.idUsuario ?? u.id_usuario ?? u.id) === String(id)) || null;
    }
    return data;
  } catch {
    return null;
  }
}

async function salvarUsuario(idUsuario) {
  const nome = document.getElementById("nome").value.trim();
  const tipoUsuario = document.getElementById("tipoUsuario").value.trim().toLowerCase();
  const contato = document.getElementById("contato").value.trim();

  if (!nome || !tipoUsuario || !contato) {
    alert("Preencha todos os campos.");
    return;
  }

  const payload = { nome, tipoUsuario, contato };
  const isEdicao = Boolean(idUsuario);
  const endpoint = isEdicao
    ? `${API_URL}/atualiza/usuario?idUsuario=${idUsuario}`
    : `${API_URL}/novo/usuario`;
  const metodo = isEdicao ? "PUT" : "POST";

  const btnSalvar = document.getElementById("btnSalvar");
  const original = btnSalvar.textContent;

  try {
    btnSalvar.disabled = true;
    btnSalvar.textContent = isEdicao ? "Atualizando..." : "Salvando...";

    const res = await fetch(endpoint, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Erro ao salvar o usuário.");
      return;
    }

    alert(`Usuário ${isEdicao ? "atualizado" : "cadastrado"} com sucesso!`);
    window.location.href = "usuarioListar.html";
  } catch (err) {
    console.error("Erro ao salvar usuário:", err);
    alert("Erro ao salvar o usuário.");
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = original;
  }
}
