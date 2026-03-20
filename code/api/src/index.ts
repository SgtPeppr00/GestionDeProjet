import { Hono } from 'hono'
import auth from './routes/auth'
import users from './routes/users'
import teams from './routes/teams'
import invitations from './routes/invitations'
import projects from './routes/projects'
import tasks from './routes/tasks'
import assets from './routes/assets'
import admin from './routes/admin'

const app = new Hono()

app.route('/', auth)
app.route('/', users)
app.route('/', teams)
app.route('/', invitations)
app.route('/', projects)
app.route('/', tasks)
app.route('/', assets)
app.route('/', admin)

export default app