import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token manquant' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await verify(token, process.env.JWT_SECRET ?? 'supersecretkey', 'HS256')
    c.set('userId', payload.id as string)
    c.set('userRole', payload.role as string)
    await next()
  } catch (e) {
    console.error('JWT error:', e)
    return c.json({ error: String(e) }, 401)
  }
})