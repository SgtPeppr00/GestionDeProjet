import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const invitations = new Hono()

// POST /teams/:teamId/invitations — Inviter un utilisateur
invitations.post('/teams/:teamId/invitations', authMiddleware, async (c) => {
  const teamId = c.req.param('teamId')
  const userId = c.get('userId')
  const { email } = await c.req.json()

  if (!email) return c.json({ error: 'email est requis' }, 400)

  const [member] = await sql`
    SELECT id FROM team_members WHERE team_id = ${teamId} AND user_id = ${userId}
  `
  if (!member) return c.json({ error: 'Accès refusé' }, 403)

  const [existing] = await sql`
    SELECT id FROM invitations WHERE team_id = ${teamId} AND email = ${email} AND status = 'pending'
  `
  if (existing) return c.json({ error: 'Invitation déjà envoyée' }, 409)

  const [invitation] = await sql`
    INSERT INTO invitations (team_id, email) VALUES (${teamId}, ${email}) RETURNING *
  `

  return c.json(invitation, 201)
})

// GET /invitations — Mes invitations
invitations.get('/invitations', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const [user] = await sql`SELECT email FROM users WHERE id = ${userId}`

  const result = await sql`
    SELECT i.*, t.name as team_name FROM invitations i
    INNER JOIN teams t ON t.id = i.team_id
    WHERE i.email = ${user.email} AND i.status = 'pending'
  `

  return c.json(result)
})

// POST /invitations/:invitationId/accept — Accepter
invitations.post('/invitations/:invitationId/accept', authMiddleware, async (c) => {
  const invitationId = c.req.param('invitationId')
  const userId = c.get('userId')

  const [user] = await sql`SELECT email FROM users WHERE id = ${userId}`

  const [invitation] = await sql`
    SELECT * FROM invitations WHERE id = ${invitationId} AND email = ${user.email} AND status = 'pending'
  `
  if (!invitation) return c.json({ error: 'Invitation introuvable' }, 404)

  await sql`
    UPDATE invitations SET status = 'accepted', updated_at = NOW() WHERE id = ${invitationId}
  `

  await sql`
    INSERT INTO team_members (team_id, user_id) VALUES (${invitation.team_id}, ${userId})
    ON CONFLICT DO NOTHING
  `

  return c.json({ message: 'Invitation acceptée' })
})

// POST /invitations/:invitationId/reject — Refuser
invitations.post('/invitations/:invitationId/reject', authMiddleware, async (c) => {
  const invitationId = c.req.param('invitationId')
  const userId = c.get('userId')

  const [user] = await sql`SELECT email FROM users WHERE id = ${userId}`

  const [invitation] = await sql`
    SELECT * FROM invitations WHERE id = ${invitationId} AND email = ${user.email} AND status = 'pending'
  `
  if (!invitation) return c.json({ error: 'Invitation introuvable' }, 404)

  await sql`
    UPDATE invitations SET status = 'rejected', updated_at = NOW() WHERE id = ${invitationId}
  `

  return c.json({ message: 'Invitation refusée' })
})

export default invitations