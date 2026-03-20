import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const assets = new Hono()

// Helper — vérifie accès à la tâche
async function checkTaskAccess(taskId: string, userId: string) {
  const [task] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`
  if (!task) return null

  const [project] = await sql`SELECT * FROM projects WHERE id = ${task.project_id}`
  if (!project) return null

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${project.team_id} AND user_id = ${userId}
  `
  return member ? task : null
}

// POST /tasks/:taskId/assets — Upload un fichier
assets.post('/tasks/:taskId/assets', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')

  const task = await checkTaskAccess(taskId, userId)
  if (!task) return c.json({ error: 'Accès refusé' }, 403)

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file === 'string') {
    return c.json({ error: 'Fichier requis' }, 400)
  }

  const filename = `${Date.now()}-${file.name}`
  const url = `/uploads/${filename}`

  const [asset] = await sql`
    INSERT INTO assets (task_id, filename, url)
    VALUES (${taskId}, ${file.name}, ${url})
    RETURNING *
  `

  return c.json(asset, 201)
})

// GET /tasks/:taskId/assets — Liste des fichiers
assets.get('/tasks/:taskId/assets', authMiddleware, async (c) => {
  const taskId = c.req.param('taskId')
  const userId = c.get('userId')

  const task = await checkTaskAccess(taskId, userId)
  if (!task) return c.json({ error: 'Accès refusé' }, 403)

  const result = await sql`SELECT * FROM assets WHERE task_id = ${taskId}`

  return c.json(result)
})

// DELETE /assets/:assetId — Supprimer un fichier
assets.delete('/assets/:assetId', authMiddleware, async (c) => {
  const assetId = c.req.param('assetId')
  const userId = c.get('userId')

  const [asset] = await sql`SELECT * FROM assets WHERE id = ${assetId}`
  if (!asset) return c.json({ error: 'Asset introuvable' }, 404)

  const task = await checkTaskAccess(asset.task_id, userId)
  if (!task) return c.json({ error: 'Accès refusé' }, 403)

  await sql`DELETE FROM assets WHERE id = ${assetId}`

  return c.json({ message: 'Asset supprimé' })
})

export default assets