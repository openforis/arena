const aws = require('aws-sdk')

const inviteUser = email =>
  new Promise((resolve, reject) => {
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
