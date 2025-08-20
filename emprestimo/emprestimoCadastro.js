"use strict";

const API_URL = "empre-equip-front-git-main-pedroking21s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const idEmprestimo = params.get("id");

  // listeners
  document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "emprestimoListar.html";
  });
  document.getElementById("btnLimpar").addEventListener("click", () => {
    document.getElementById("formEmprestimo").reset();
  });
  document.getElementById("btnCancelar").addEventListener("click", () => {
    window.location.href = "emprestimoListar.html";
  });

  document.getElementById("formEmprestimo").addEventListener("submit", async (e) => {
    e.preventDefault();
    await salvarEmprestimo(idEmprestimo);
  });

  // carrega selects
  await Promise.all([carregarUsuariosOptions(), carregarEquipamentosOptions()]);

  if (idEmprestimo) {
    prepararEdicaoUI();
    await carregarEmprestimoPorId(idEmprestimo);
  } else {
    document.title = "Cadastro de Empréstimo";
    // default de status (opcional)
    const sel = document.getElementById("status");
    if (sel && !sel.value) sel.value = "ativo";
  }
});

function prepararEdicaoUI() {
  document.getElementById("tituloEmprestimo").innerText = "Edição de Empréstimo";
  document.title = "Edição de Empréstimo";
  document.getElementById("btnCancelar").classList.remove("hidden");
  document.getElementById("btnSalvar").textContent = "Atualizar";
}

function toDateInputValue(iso) {
  if (!iso) return "";
  const s = String(iso);
  return s.slice(0, 10); // YYYY-MM-DD
}

async function carregarEmprestimoPorId(idEmprestimo) {
  const btnSalvar = document.getElementById("btnSalvar");
  const voltarBtns = document.querySelectorAll(".btn-voltar");
  const original = btnSalvar.textContent;

  try {
    btnSalvar.disabled = true;
    voltarBtns.forEach((b) => (b.disabled = true));
    btnSalvar.textContent = "Carregando...";

    let emp = await fetchEmprestimoRest(idEmprestimo);
    if (!emp) emp = await fetchEmprestimoQuery(idEmprestimo);

    if (!emp) {
      alert("Empréstimo não encontrado.");
      window.location.href = "emprestimoListar.html";
      return;
    }

    document.getElementById("idUsuario").value = emp.usuario?.idUsuario ?? "";
    document.getElementById("idEquipamento").value = emp.equipamento?.idEquipamento ?? "";
    document.getElementById("dataEmprestimo").value = toDateInputValue(emp.dataEmprestimo);
    document.getElementById("dataPrevistaDevolucao").value = toDateInputValue(emp.dataPrevistaDevolucao);
    document.getElementById("dataRealDevolucao").value = toDateInputValue(emp.dataRealDevolucao);
    document.getElementById("status").value = emp.status ?? "";
  } catch (err) {
    console.error("Erro ao carregar empréstimo:", err);
    alert("Erro ao carregar os dados do empréstimo.");
    window.location.href = "emprestimoListar.html";
  } finally {
    btnSalvar.disabled = false;
    voltarBtns.forEach((b) => (b.disabled = false));
    btnSalvar.textContent = original;
  }
}

async function fetchEmprestimoRest(id) {
  try {
    const r = await fetch(`${API_URL}/emprestimo/${id}`);
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchEmprestimoQuery(id) {
  try {
    const r = await fetch(`${API_URL}/lista/emprestimo?idEmprestimo=${id}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (Array.isArray(data)) {
      return data.find((e) => String(e.idEmprestimo ?? e.id_emprestimo ?? e.id) === String(id)) || null;
    }
    return data;
  } catch {
    return null;
  }
}

async function carregarUsuariosOptions() {
  const sel = document.getElementById("idUsuario");
  sel.innerHTML = `<option value="">Carregando...</option>`;
  try {
    const r = await fetch(`${API_URL}/lista/usuario`);
    const data = await r.json();
    const usuarios = Array.isArray(data) ? data : [];
    sel.innerHTML = `<option value="">Selecione</option>`;
    usuarios.forEach((u) => {
      const id = u.idUsuario ?? u.id_usuario ?? u.id;
      const nome = u.nome ?? "(sem nome)";
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
    sel.innerHTML = `<option value="">Erro ao carregar</option>`;
  }
}

async function carregarEquipamentosOptions() {
  const sel = document.getElementById("idEquipamento");
  sel.innerHTML = `<option value="">Carregando...</option>`;
  try {
    const r = await fetch(`${API_URL}/lista/equipamento`);
    const data = await r.json();
    const equipamentos = Array.isArray(data) ? data : [];
    sel.innerHTML = `<option value="">Selecione</option>`;
    equipamentos.forEach((e) => {
      const id = e.idEquipamento ?? e.id_equipamento ?? e.id;
      const nome = e.nome ?? "(sem nome)";
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar equipamentos:", err);
    sel.innerHTML = `<option value="">Erro ao carregar</option>`;
  }
}

async function salvarEmprestimo(idEmprestimo) {
  const idUsuario = document.getElementById("idUsuario").value;
  const idEquipamento = document.getElementById("idEquipamento").value;
  const dataEmprestimo = document.getElementById("dataEmprestimo").value;
  const dataPrevistaDevolucao = document.getElementById("dataPrevistaDevolucao").value;
  const dataRealDevolucao = document.getElementById("dataRealDevolucao").value;
  const status = document.getElementById("status").value;

  if (!idUsuario || !idEquipamento || !dataEmprestimo || !dataPrevistaDevolucao || !status) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const payload = {
    idUsuario: Number(idUsuario),
    idEquipamento: Number(idEquipamento),
    dataEmprestimo,               // YYYY-MM-DD
    dataPrevistaDevolucao,        // YYYY-MM-DD
    dataRealDevolucao: dataRealDevolucao || null,
    status
  };

  const isEdicao = Boolean(idEmprestimo);
  const endpoint = isEdicao
    ? `${API_URL}/atualiza/emprestimo?idEmprestimo=${idEmprestimo}`
    : `${API_URL}/novo/emprestimo`;
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
      alert("Erro ao salvar o empréstimo.");
      return;
    }

    alert(`Empréstimo ${isEdicao ? "atualizado" : "cadastrado"} com sucesso!`);
    window.location.href = "emprestimoListar.html";
  } catch (err) {
    console.error("Erro ao salvar empréstimo:", err);
    alert("Erro ao salvar o empréstimo.");
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = original;
  }
}
