import { neon } from '@neondatabase/serverless';

// Conecta ao banco de dados usando a chave que o Vercel guarda em DATABASE_URL
const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
  try {
    // LISTAR (Retrieve): devolve todas as tarefas
    if (request.method === 'GET') {
      const tarefas = await sql`SELECT * FROM tarefas ORDER BY id DESC`;
      return response.status(200).json(tarefas);
    }

    // CRIAR (Create): insere uma nova tarefa
    if (request.method === 'POST') {
      const { titulo, descricao, projeto, prazo, status } = request.body;
      if (!titulo) {
        return response.status(400).json({ erro: 'O título é obrigatório.' });
      }
      const [nova] = await sql`
        INSERT INTO tarefas (titulo, descricao, projeto, prazo, status)
        VALUES (${titulo}, ${descricao || null}, ${projeto || null}, ${prazo || null}, ${status || 'Pendente'})
        RETURNING *`;
      return response.status(201).json(nova);
    }

    // ATUALIZAR (Update): altera os dados de uma tarefa existente
    if (request.method === 'PUT') {
      const { id } = request.query;
      const { titulo, descricao, projeto, prazo, status } = request.body;
      if (!titulo) {
        return response.status(400).json({ erro: 'O título é obrigatório.' });
      }
      const [atualizada] = await sql`
        UPDATE tarefas
        SET titulo = ${titulo},
            descricao = ${descricao || null},
            projeto = ${projeto || null},
            prazo = ${prazo || null},
            status = ${status || 'Pendente'}
        WHERE id = ${id}
        RETURNING *`;
      if (!atualizada) {
        return response.status(404).json({ erro: 'Tarefa não encontrada.' });
      }
      return response.status(200).json(atualizada);
    }

    // REMOVER (Delete): apaga uma tarefa
    if (request.method === 'DELETE') {
      const { id } = request.query;
      await sql`DELETE FROM tarefas WHERE id = ${id}`;
      return response.status(200).json({ ok: true });
    }

    return response.status(405).json({ erro: 'Método não permitido.' });
  } catch (erro) {
    return response.status(500).json({ erro: erro.message });
  }
}