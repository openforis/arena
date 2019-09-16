const aws = require('aws-sdk')

const ProcessEnv = require('./processEnv')

const _getAwsClient = () =>
  new aws.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-19',
    region: ProcessEnv.cognitoRegion,
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
    UserPoolId: ProcessEnv.cognitoUserPoolId,
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

const updateUser = (oldEmail, email, name) => {
  if (email === null && name === null) {
    return
  }

  const UserAttributes = email === null
    ? []
    : [{
      Name: 'email',
      Value: email,
    }, {
      Name: 'email_verified',
      Value: 'true',
    }]

  if (name !== null) {
    UserAttributes.push({
      Name: 'name',
      Value: name,
    })
  }

  const params = {
    UserAttributes,
    Username: oldEmail,
    UserPoolId: ProcessEnv.cognitoUserPoolId
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
    region: ProcessEnv.cognitoRegion,
  }).sendEmail(params).promise()
}

module.exports = {
  inviteUser,
  updateUser,
  sendEmail,
}
