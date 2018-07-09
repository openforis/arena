module.exports = async () => {
  try {
    console.log('running database migrations')
    
    const config = require('./migrationConfig')
    
    const options = {
      config,
      cwd: `${__dirname}/`,
      env: process.env.NODE_ENV,
    }
    
    const dbm = require('db-migrate').getInstance(true, options)
    
    await dbm.up()
    
    console.log('database migrations completed')
  } catch (err) {
    console.log('error running database migrations', err)
  }
  
}