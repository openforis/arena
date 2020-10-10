require('dotenv').config()

module.exports = {
  MIN_FREE_INSTANCES: process.env.MIN_FREE_INSTANCES,
  MAX_INSTANCES: process.env.MAX_INSTANCES,
  IMAGE_ID: process.env.IMAGE_ID,
  IMAGE_TYPE: process.env.IMAGE_TYPE,
  REGION: process.env.REGION,
  ACCOUNT: process.env.ACCOUNT,
  SECURITY_GROUP: process.env.SECURITY_GROUP,
  INSTANCE_PROFILE: process.env.INSTANCE_PROFILE,
  KEY_NAME: process.env.KEY_NAME,
}
