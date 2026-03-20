import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const teams = new Hono()

// POST /teams — Créer une équipe
teams.post('/teams', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { name } = await c.req.json()

  if (!name) {
    return c.json({ error: 'name est requis' }, 400)
  }

  const [team] = await sql`
    INSERT INTO teams (name) VALUES (${name}) RETURNING *
  `

  await sql`
    INSERT INTO team_members (team_id, user_id) VALUES (${team.id}, ${userId})
  `

  return c.json(team, 201)
})

// GET /teams — Mes équipes
teams.get('/teams', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const result = await sql`
    SELECT t.* FROM teams t
    INNER JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ${userId}
  `

  return c.json(result)
})

// GET /teams/:teamId — Détail d'une équipe
teams.get('/teams/:teamId', authMiddleware, async (c) => {
  const teamId = c.req.param('teamId')
  const userId = c.get('userId')

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const [team] = await sql`SELECT * FROM teams WHERE id = ${teamId}`
  if (!team) return c.json({ error: 'Équipe introuvable' }, 404)

  return c.json(team)
})

// GET /teams/:teamId/members — Membres d'une équipe
teams.get('/teams/:teamId/members', authMiddleware, async (c) => {
  const teamId = c.req.param('teamId')
  const userId = c.get('userId')

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const members = await sql`
    SELECT u.id, u.name, u.email FROM users u
    INNER JOIN team_members tm ON tm.user_id = u.id
    WHERE tm.team_id = ${teamId}
  `

  return c.json(members)
})

export default teams