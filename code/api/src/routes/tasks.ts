import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const tasks = new Hono()

// Helper — vérifie que l'user est membre du projet
async function checkProjectMember(projectId: string, userId: string) {
  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`
  if (!project) return null
  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${project.team_id} AND user_id = ${userId}
  `
  return member ? project : null
}

// POST /projects/:projectId/tasks
tasks.post('/projects/:projectId/tasks', authMiddleware, async (c) => {
  const projectId = c.req.param('projectId')
  const userId = c.get('userId')
  const { name, description, status } = await c.req.json()

  if (!name) return c.json({ error: 'name est requis' }, 400)

  const project = await checkProjectMember(projectId, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  const [task] = await sql`
    INSERT INTO tasks (project_id, name, description, status)
    VALUES (${projectId}, ${name}, ${description ?? null}, ${status ?? 'todo'})
    RETURNING *
  `

  return c.json(task, 201)
})

// GET /projects/:projectId/tasks
tasks.get('/projects/:projectId/tasks', authMiddleware, async (c) => {
  const projectId = c.req.param('projectId')
  const userId = c.get('userId')

  const project = await checkProjectMember(projectId, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  const result = await sql`SELECT * FROM tasks WHERE project_id = ${projectId}`

  return c.json(result)
})

// GET /tasks/:taskId
tasks.get('/tasks/:taskId', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return c.json({ error: 'Tâche introuvable' }, 404)

  const project = await checkProjectMember(task.project_id, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  return c.json(task)
})

// PATCH /tasks/:taskId
tasks.patch('/tasks/:taskId', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')
  const { name, description } = await c.req.json()

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return c.json({ error: 'Tâche introuvable' }, 404)

  const project = await checkProjectMember(task.project_id, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  const [updated] = await sql`
    UPDATE tasks SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING *
  `

  return c.json(updated)
})

// DELETE /tasks/:taskId
tasks.delete('/tasks/:taskId', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return c.json({ error: 'Tâche introuvable' }, 404)

  const project = await checkProjectMember(task.project_id, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  await sql`DELETE FROM tasks WHERE id = ${taskId}`

  return c.json({ message: 'Tâche supprimée' })
})

// PATCH /tasks/:taskId/assign
tasks.patch('/tasks/:taskId/assign', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')
  const { assigned_to } = await c.req.json()

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return c.json({ error: 'Tâche introuvable' }, 404)

  const project = await checkProjectMember(task.project_id, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  const [updated] = await sql`
    UPDATE tasks SET assigned_to = ${assigned_to}, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING *
  `

  return c.json(updated)
})

// PATCH /tasks/:taskId/status
tasks.patch('/tasks/:taskId/status', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')
  const { status } = await c.req.json()

  if (!['todo', 'in_progress', 'done'].includes(status)) {
    return c.json({ error: 'Status invalide (todo, in_progress, done)' }, 400)
  }

  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return c.json({ error: 'Tâche introuvable' }, 404)

  const project = await checkProjectMember(task.project_id, userId)
  if (!project) return c.json({ error: 'Accès refusé' }, 403)

  const [updated] = await sql`
    UPDATE tasks SET status = ${status}, updated_at = NOW()
    WHERE id = ${taskId}
    RETURNING *
  `

  return c.json(updated)
})

export default tasks