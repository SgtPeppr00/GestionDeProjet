import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import sql from '../db'

const admin = new Hono()

// Middleware admin
const adminMiddleware = async (c: any, next: any) => {
  const role = c.get('userRole')
  if (role !== 'admin') {
    return c.json({ error: 'Accès réservé aux administrateurs' }, 403)
  }
  await next()
}

// GET /admin/stats
admin.get('/admin/stats', authMiddleware, adminMiddleware, async (c) => {
  const [users] = await sql`SELECT COUNT(*) as count FROM users`
  const [teams] = await sql`SELECT COUNT(*) as count FROM teams`
  const [projects] = await sql`SELECT COUNT(*) as count FROM projects`
  const [tasks] = await sql`SELECT COUNT(*) as count FROM tasks`

  return c.json({
    users: Number(users.count),
    teams: Number(teams.count),
    projects: Number(projects.count),
    tasks: Number(tasks.count),
  })
})

// GET /admin/users
admin.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const result = await sql`
    SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC
  `
  return c.json(result)
})

// GET /admin/backups
admin.get('/admin/backups', authMiddleware, adminMiddleware, async (c) => {
  const result = await sql`SELECT * FROM backups ORDER BY created_at DESC`
  return c.json(result)
})

export default admin