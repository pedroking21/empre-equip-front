//const API_URL = "http://localhost:3000";
const API_URL = "https://emp-equipe-didatico-aula.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#usuariosTable tbody");

  // Navegação topo
  document.getElementById("btnVoltar").addEventListener("click", () => {
    window.location.href = "../menu.html";
  });
  document.getElementById("btnNovo").addEventListener("click", () => {
    window.location.href = "usuarioCadastro.html";
  });

  // Delegação de eventos para botões dinâmicos (editar/excluir)
  tbody.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (btn.dataset.action === "edit") {
      window.location.href = `usuarioCadastro.html?id=${id}`;
    } else if (btn.dataset.action === "delete") {
      deletarUsuario(id);
    }
  });

  carregarUsuarios();
});

async function carregarUsuarios() {
  const tbody = document.querySelector("#usuariosTable tbody");
  tbody.innerHTML = `<tr><td colspan="4">Carregando...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/lista/usuario`);
    if (!res.ok) {
      console.error("Falha no fetch:", res.status, res.statusText);
      tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar usuários.</td></tr>`;
      return;
    }

    const data = await res.json();
    const usuarios = Array.isArray(data) ? data : [];

    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    // normaliza possíveis nomes de campos do backend
    const norm = (u) => ({
      idUsuario: u.idUsuario ?? u.id_usuario ?? u.id,
      nome: u.nome ?? "",
      tipoUsuario: u.tipoUsuario ?? u.tipo_usuario ?? "",
      contato: u.contato ?? ""
    });

    tbody.innerHTML = ""; // limpa placeholder
    usuarios.forEach((u) => {
      const n = norm(u);
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${n.nome ?? u.nome}</td>
      <td>${n.tipoUsuario ?? u.tipoUsuario}</td>
      <td>${n.contato ?? u.contato}</td>
      <td class="acoes">
         <button class="btn-acao btn-editar" data-action="edit" data-id="${n.idUsuario ?? u.idUsuario}">Editar</button>
         <button class="btn-acao btn-excluir" data-action="delete" data-id="${n.idUsuario ?? u.idUsuario}">Excluir</button>
      </td>
    `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
    document.querySelector("#usuariosTable tbody").innerHTML =
      `<tr><td colspan="4">Erro ao carregar (veja o console).</td></tr>`;
  }
}

async function deletarUsuario(idUsuario) {
  if (!confirm("Deseja realmente excluir este usuário?")) return;
  try {
    const res = await fetch(`${API_URL}/remove/usuario?idUsuario=${idUsuario}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erro ao excluir usuário.");
      return;
    }
    alert("Usuário excluído com sucesso!");
    carregarUsuarios();
  } catch (err) {
    console.error("Erro ao excluir usuário:", err);
    alert("Erro ao excluir usuário (ver console).");
  }
}
