"use strict";

const API_URL = "https://empre-equip-front-cgagmupog-pedroking21s-projects.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#emprestimosTable tbody");

  document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "../menu.html";
  });

  document.getElementById("btnNovo").addEventListener("click", () => {
    window.location.href = "emprestimoCadastro.html";
  });

  // delegação para botões dinâmicos
  tbody.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.dataset.action === "edit") {
      window.location.href = `emprestimoCadastro.html?id=${id}`;
    } else if (btn.dataset.action === "delete") {
      deletarEmprestimo(id);
    }
  });

  carregarEmprestimos();
});

function isoToBR(iso) {
  if (!iso) return "-";
  const s = String(iso);
  const yyyy = s.slice(0, 4);
  const mm = s.slice(5, 7);
  const dd = s.slice(8, 10);
  if (!yyyy || !mm || !dd) return "-";
  return `${dd}/${mm}/${yyyy}`;
}

async function carregarEmprestimos() {
  const tbody = document.querySelector("#emprestimosTable tbody");
  tbody.innerHTML = `<tr><td colspan="9">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/lista/emprestimo`);
    if (!res.ok) {
      console.error("Falha no fetch:", res.status, res.statusText);
      tbody.innerHTML = `<tr><td colspan="9">Erro ao carregar empréstimos.</td></tr>`;
      return;
    }

    const data = await res.json();
    const emprestimos = Array.isArray(data) ? data : [];

    if (emprestimos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9">Nenhum empréstimo encontrado.</td></tr>`;
      return;
    }

  const norm = (e) => {
    // pega o flag bruto em qualquer nome que vier
    const rawFlag = e.estaEmAtraso ?? e.em_atraso ?? e.atrasado ?? e.esta_atrasado;
    // normaliza booleano OU calcula por data se vier nulo/indefinido
    let atrasado;
    if (rawFlag !== undefined && rawFlag !== null) {
      atrasado = toBool(rawFlag);
    } else {
      atrasado = isOverdue(
        e.dataPrevistaDevolucao ?? e.data_prevista_devolucao,
        e.dataRealDevolucao ?? e.data_real_devolucao,
        e.status
      );
  }

  return {
    idEmprestimo: e.idEmprestimo ?? e.id_emprestimo ?? e.id,
    dataEmprestimo: e.dataEmprestimo ?? e.data_emprestimo ?? null,
    dataPrevistaDevolucao: e.dataPrevistaDevolucao ?? e.data_prevista_devolucao ?? null,
    dataRealDevolucao: e.dataRealDevolucao ?? e.data_real_devolucao ?? null,
    status: e.status ?? "",
    estaEmAtraso: atrasado,
    usuario: {
      idUsuario: e.usuario?.idUsuario ?? e.usuario?.id_usuario ?? null,
      nome: e.usuario?.nome ?? ""
    },
    equipamento: {
      idEquipamento: e.equipamento?.idEquipamento ?? e.equipamento?.id_equipamento ?? null,
      nome: e.equipamento?.nome ?? ""
    }
  };
};

    tbody.innerHTML = "";
    emprestimos.forEach((e) => {
      const n = norm(e);
      const situacaoTexto = n.estaEmAtraso ? "Está atrasado" : "Não está atrasado";
      const situacaoClasse = n.estaEmAtraso ? "badge-err" : "badge-ok";
      const statusExibicao = n.estaEmAtraso ? "atrasado" : n.status;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${n.idEmprestimo}</td>
        <td>${n.usuario.nome}</td>
        <td>${n.equipamento.nome}</td>
        <td>${isoToBR(n.dataEmprestimo)}</td>
        <td>${isoToBR(n.dataPrevistaDevolucao)}</td>
        <td>${isoToBR(n.dataRealDevolucao)}</td>
        <td>${statusExibicao}</td>
          <td><span class="badge ${situacaoClasse}">${situacaoTexto}</span></td>
        <td class="acoes">
          <button class="btn-acao btn-editar" data-action="edit" data-id="${n.idEmprestimo}">Editar</button>
          <button class="btn-acao btn-excluir" data-action="delete" data-id="${n.idEmprestimo}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar empréstimos:", err);
    tbody.innerHTML = `<tr><td colspan="9">Erro ao carregar (veja o console).</td></tr>`;
  }
}

async function deletarEmprestimo(idEmprestimo) {
  if (!confirm("Deseja realmente excluir este empréstimo?")) return;
  try {
    const res = await fetch(`${API_URL}/remove/emprestimo?idEmprestimo=${idEmprestimo}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erro ao excluir empréstimo.");
      return;
    }
    alert("Empréstimo excluído com sucesso!");
    carregarEmprestimos();
  } catch (err) {
    console.error("Erro ao excluir empréstimo:", err);
    alert("Erro ao excluir empréstimo (ver console).");
  } 
}

// --- helpers robustos ---
function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "sim", "yes", "y"].includes(s)) return true;
    if (["false", "0", "nao", "não", "no", "n", "", "null", "undefined"].includes(s)) return false;
  }
  return false; // default seguro
}

function parseDateOnly(val) {
  if (!val) return null;
  const s = String(val);
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7)) - 1;
  const d = Number(s.slice(8, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  // cria Date no fuso local, sem horário
  return new Date(y, m, d);
}

function isOverdue(dataPrevistaDevolucao, dataRealDevolucao, status) {
  // concluído nunca está em atraso
  if ((status || "").toLowerCase() === "concluido") return false;
  if (dataRealDevolucao) return false;
  const due = parseDateOnly(dataPrevistaDevolucao);
  if (!due) return false;
  const hoje = new Date();
  const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return today > due;
}
