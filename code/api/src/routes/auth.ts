import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import sql from '../db'

const auth = new Hono()

// POST /users — Register
auth.post('/users', async (c) => {
  const { email, password, name } = await c.req.json()

  if (!email || !password || !name) {
    return c.json({ error: 'email, password et name sont requis' }, 400)
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return c.json({ error: 'Email déjà utilisé' }, 409)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const [user] = await sql`
    INSERT INTO users (email, password, name)
    VALUES (${email}, ${hashedPassword}, ${name})
    RETURNING id, email, name, role, created_at
  `

  return c.json(user, 201)
})

// POST /auth/login — Login
auth.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'email et password sont requis' }, 400)
  }

  const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
  if (!user) {
    return c.json({ error: 'Email ou mot de passe incorrect' }, 401)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return c.json({ error: 'Email ou mot de passe incorrect' }, 401)
  }

  const token = await sign(
    { id: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    process.env.JWT_SECRET ?? 'supersecretkey'
  )

  return c.json({ token })
})

export default auth