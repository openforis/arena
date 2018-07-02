module.exports = {
  
  development: {
    driver: 'pg',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    schema: process.env.PGSCHEMA,
  },
  
  production: {
    ssl: true,
  }
  
}