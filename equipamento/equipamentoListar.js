"use strict";

const API_URL = "https://empre-equip-front-cgagmupog-pedroking21s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#equipamentosTable tbody");

  document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "../menu.html";
  });

  document.getElementById("btnNovo").addEventListener("click", () => {
    window.location.href = "equipamentoCadastro.html";
  });

  // delegação p/ botões dinâmicos
  tbody.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.dataset.action === "edit") {
      window.location.href = `equipamentoCadastro.html?id=${id}`;
    } else if (btn.dataset.action === "delete") {
      deletarEquipamento(id);
    }
  });

  carregarEquipamentos();
});

async function carregarEquipamentos() {
  const tbody = document.querySelector("#equipamentosTable tbody");
  tbody.innerHTML = `<tr><td colspan="4">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/lista/equipamento`);
    if (!res.ok) {
      console.error("Falha no fetch:", res.status, res.statusText);
      tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar equipamentos.</td></tr>`;
      return;
    }

    const data = await res.json();
    const equipamentos = Array.isArray(data) ? data : [];

    if (equipamentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Nenhum equipamento encontrado.</td></tr>`;
      return;
    }

    const norm = (e) => ({
      idEquipamento: e.idEquipamento ?? e.id_equipamento ?? e.id,
      nome: e.nome ?? "",
      categoria: e.categoria ?? "",
      status: e.status ?? e.status_equipamento ?? ""
    });

    tbody.innerHTML = "";
    equipamentos.forEach((e) => {
      const n = norm(e);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${n.nome}</td>
        <td>${n.categoria}</td>
        <td>${n.status}</td>
        <td class="acoes">
          <button class="btn-acao btn-editar" data-action="edit" data-id="${n.idEquipamento}">Editar</button>
          <button class="btn-acao btn-excluir" data-action="delete" data-id="${n.idEquipamento}">Excluir</button>
         </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar equipamentos:", err);
    tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar (veja o console).</td></tr>`;
  }
}

async function deletarEquipamento(idEquipamento) {
  if (!confirm("Deseja realmente excluir este equipamento?")) return;
  try {
    const res = await fetch(`${API_URL}/remove/equipamento?idEquipamento=${idEquipamento}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erro ao excluir equipamento.");
      return;
    }
    alert("Equipamento excluído com sucesso!");
    carregarEquipamentos();
  } catch (err) {
    console.error("Erro ao excluir equipamento:", err);
    alert("Erro ao excluir equipamento (ver console).");
  }
}
