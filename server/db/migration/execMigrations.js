module.exports = async () => {
  try {
    console.log('running migrations')
    
    const config = require('./migrationConfig')
    
    const options = {
      config,
      cwd: `${__dirname}/`,
      env: process.env.NODE_ENV,
    }
    
    const dbm = require('db-migrate').getInstance(true, options)
    
    await dbm.up()
    
    console.log('migration check completed')
  } catch (err) {
    console.log('error running migrations', err)
  }
  
}