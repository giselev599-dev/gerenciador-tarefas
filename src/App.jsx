import { useEffect, useState } from 'react';

const FORM_VAZIO = {
  titulo: '',
  descricao: '',
  projeto: '',
  prazo: '',
  status: 'Pendente',
};

const CLASSE_STATUS = {
  'Pendente': 'pendente',
  'Em andamento': 'andamento',
  'Concluída': 'concluida',
};

function formatarData(prazo) {
  if (!prazo) return 'Sem prazo';
  const [ano, mes, dia] = prazo.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // LISTAR: busca todas as tarefas no back-end
  async function carregarTarefas() {
    try {
      const resposta = await fetch('/api/tarefas');
      if (!resposta.ok) throw new Error();
      setTarefas(await resposta.json());
      setErro('');
    } catch {
      setErro('Não foi possível carregar as tarefas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTarefas();
  }, []);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setForm({ ...form, [name]: value });
  }

  // CRIAR (se for tarefa nova) ou ATUALIZAR (se estiver editando)
  async function salvar(evento) {
    evento.preventDefault();
    const url = editandoId ? `/api/tarefas?id=${editandoId}` : '/api/tarefas';
    const metodo = editandoId ? 'PUT' : 'POST';
    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resposta.ok) throw new Error();
      setForm(FORM_VAZIO);
      setEditandoId(null);
      await carregarTarefas();
    } catch {
      setErro('Não foi possível salvar a tarefa.');
    }
  }

  // Preenche o formulário com os dados da tarefa escolhida
  function editar(tarefa) {
    setEditandoId(tarefa.id);
    setForm({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      projeto: tarefa.projeto || '',
      prazo: tarefa.prazo ? tarefa.prazo.slice(0, 10) : '',
      status: tarefa.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
  }

  // REMOVER: apaga a tarefa depois de confirmar
  async function remover(id) {
    if (!window.confirm('Deseja remover esta tarefa?')) return;
    try {
      const resposta = await fetch(`/api/tarefas?id=${id}`, { method: 'DELETE' });
      if (!resposta.ok) throw new Error();
      if (editandoId === id) cancelarEdicao();
      await carregarTarefas();
    } catch {
      setErro('Não foi possível remover a tarefa.');
    }
  }

  return (
    <div className="pagina">
      <header className="cabecalho">
        <h1>Gerenciador de Tarefas</h1>
        <p>Cadastre, acompanhe e conclua as tarefas dos seus projetos.</p>
      </header>

      <form className="formulario" onSubmit={salvar}>
        <h2>{editandoId ? 'Editar tarefa' : 'Nova tarefa'}</h2>

        <label>
          Título
          <input
            name="titulo"
            value={form.titulo}
            onChange={alterarCampo}
            placeholder="Ex.: Revisar relatório"
            required
          />
        </label>

        <label>
          Descrição
          <textarea
            name="descricao"
            rows="2"
            value={form.descricao}
            onChange={alterarCampo}
            placeholder="Detalhes da tarefa (opcional)"
          />
        </label>

        <div className="linha">
          <label>
            Projeto
            <input
              name="projeto"
              value={form.projeto}
              onChange={alterarCampo}
              placeholder="Ex.: TCC"
            />
          </label>

          <label>
            Prazo
            <input
              type="date"
              name="prazo"
              value={form.prazo}
              onChange={alterarCampo}
            />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={alterarCampo}>
              <option>Pendente</option>
              <option>Em andamento</option>
              <option>Concluída</option>
            </select>
          </label>
        </div>

        <div className="acoes">
          <button type="submit" className="botao principal">
            {editandoId ? 'Salvar alterações' : 'Adicionar tarefa'}
          </button>
          {editandoId && (
            <button type="button" className="botao" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <p className="erro" role="alert">{erro}</p>}

      <section>
        <h2>Tarefas ({tarefas.length})</h2>

        {carregando && <p className="aviso">Carregando...</p>}

        {!carregando && tarefas.length === 0 && (
          <p className="aviso">Nenhuma tarefa cadastrada ainda.</p>
        )}

        <ul className="lista">
          {tarefas.map((tarefa) => (
            <li key={tarefa.id} className="tarefa">
              <div className="tarefa-topo">
                <h3>{tarefa.titulo}</h3>
                <span className={`etiqueta ${CLASSE_STATUS[tarefa.status] || 'pendente'}`}>
                  {tarefa.status}
                </span>
              </div>

              {tarefa.descricao && <p>{tarefa.descricao}</p>}

              <p className="detalhes">
                Projeto: {tarefa.projeto || 'Sem projeto'} · Prazo: {formatarData(tarefa.prazo)}
              </p>

              <div className="acoes">
                <button type="button" className="botao" onClick={() => editar(tarefa)}>
                  Editar
                </button>
                <button type="button" className="botao perigo" onClick={() => remover(tarefa.id)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;