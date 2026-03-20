import postgres from 'postgres'

const sql = postgres({
  host: 'localhost',
  port: 5433,
  database: 'gestion_projet',
  user: 'postgres',
  password: 'postgres',
  ssl: false,
})

export default sql