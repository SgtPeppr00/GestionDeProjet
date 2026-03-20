import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = postgres({
  host: 'localhost',
  port: 5433,
  database: 'gestion_projet',
  user: 'postgres',
  password: 'postgres',
  ssl: false,
})

const migration = readFileSync(join(import.meta.dir, '001_init.sql'), 'utf-8')

await sql.unsafe(migration)
console.log('Migrations exécutées avec succès')

await sql.end()
process.exit(0)