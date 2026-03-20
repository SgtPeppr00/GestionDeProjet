import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const users = new Hono()

// GET /me
users.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const [user] = await sql`
    SELECT id, email, name, role, created_at, updated_at
    FROM users
    WHERE id = ${userId}
  `

  if (!user) {
    return c.json({ error: 'Utilisateur introuvable' }, 404)
  }

  return c.json(user)
})

// PATCH /me
users.patch('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { name, email } = await c.req.json()

  if (!name && !email) {
    return c.json({ error: 'name ou email requis' }, 400)
  }

  const [user] = await sql`
    UPDATE users
    SET
      name = COALESCE(${name ?? null}, name),
      email = COALESCE(${email ?? null}, email),
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, name, role, updated_at
  `

  return c.json(user)
})

export default users