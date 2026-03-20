import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const projects = new Hono()

// POST /teams/:teamId/projects
projects.post('/teams/:teamId/projects', authMiddleware, async (c) => {
  const teamId = c.req.param('teamId')
  const userId = c.get('userId')
  const { name, description } = await c.req.json()

  if (!name) return c.json({ error: 'name est requis' }, 400)

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const [project] = await sql`
    INSERT INTO projects (team_id, name, description)
    VALUES (${teamId}, ${name}, ${description ?? null})
    RETURNING *
  `

  return c.json(project, 201)
})

// GET /teams/:teamId/projects
projects.get('/teams/:teamId/projects', authMiddleware, async (c) => {
  const teamId = c.req.param('teamId')
  const userId = c.get('userId')

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const result = await sql`SELECT * FROM projects WHERE team_id = ${teamId}`

  return c.json(result)
})

// GET /projects/:projectId
projects.get('/projects/:projectId', authMiddleware, async (c) => {
  const projectId = c.req.param('projectId')
  const userId = c.get('userId')

  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`
  if (!project) return c.json({ error: 'Projet introuvable' }, 404)

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${project.team_id} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  return c.json(project)
})

// PATCH /projects/:projectId
projects.patch('/projects/:projectId', authMiddleware, async (c) => {
  const projectId = c.req.param('projectId')
  const userId = c.get('userId')
  const { name, description } = await c.req.json()

  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`
  if (!project) return c.json({ error: 'Projet introuvable' }, 404)

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${project.team_id} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const [updated] = await sql`
    UPDATE projects SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      updated_at = NOW()
    WHERE id = ${projectId}
    RETURNING *
  `

  return c.json(updated)
})

// DELETE /projects/:projectId
projects.delete('/projects/:projectId', authMiddleware, async (c) => {
  const projectId = c.req.param('projectId')
  const userId = c.get('userId')

  const [project] = await sql`SELECT * FROM projects WHERE id = ${projectId}`
  if (!project) return c.json({ error: 'Projet introuvable' }, 404)

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${project.team_id} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  await sql`DELETE FROM projects WHERE id = ${projectId}`

  return c.json({ message: 'Projet supprimé' })
})

export default projects