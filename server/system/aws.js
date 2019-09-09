const aws = require('aws-sdk')

const _getAwsClient = () =>
  new aws.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-19',
    region: process.env.COGNITO_REGION,
  })

const _sendAwsRequest = request =>
  new Promise((resolve, reject) => {
    request.send((err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

const inviteUser = (email, temporaryPassword) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    // Username and email are the same in our case
    Username: email,
    TemporaryPassword: temporaryPassword,
    // Message will be sent by us
    MessageAction: 'SUPPRESS',
    ForceAliasCreation: false,
    UserAttributes: [{
      Name: 'email',
      Value: email
    }, {
      Name: 'email_verified',
      Value: 'true',
    }]
  }

  return _sendAwsRequest(_getAwsClient().adminCreateUser(params))
}

const updateEmail = (oldEmail, newEmail) => {
  const params = {
    UserAttributes: [{
      Name: 'email',
      Value: newEmail,
    }, {
      Name: 'email_verified',
      Value: 'true',
    }],
    Username: oldEmail,
    UserPoolId: process.env.COGNITO_USER_POOL_ID
  }

  return _sendAwsRequest(_getAwsClient().adminUpdateUserAttributes(params))
}

const sendEmail = (from, to, subject, body) => {
  // Create sendEmail params 
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: from,
    ReplyToAddresses: [from],
  }

  // Returns a promise
  return new aws.SES({
    apiVersion: '2010-12-01',
    region: process.env.COGNITO_REGION,
  }).sendEmail(params).promise()
}

module.exports = {
  inviteUser,
  updateEmail,
  sendEmail,
}
