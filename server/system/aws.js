const aws = require('aws-sdk')

const inviteUser = (name, email) =>
  new Promise((resolve, reject) => {
    aws.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    const awsClient = new aws.CognitoIdentityServiceProvider({
      apiVersion: '2016-04-19',
      region: process.env.COGNITO_REGION,
    })

    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      // Username needs to be same as email in our case
      Username: email,
      DesiredDeliveryMediums: ['EMAIL'],
      ForceAliasCreation: false,
      UserAttributes: [{
        Name: 'email',
        Value: email
      }, {
        Name: 'name',
        Value: name
      }]
    }

    const request = awsClient.adminCreateUser(params)
    request.send((err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

module.exports = {
  inviteUser,
}
