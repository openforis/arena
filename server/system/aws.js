import * as aws from 'aws-sdk'

import * as ProcessUtils from '@core/processUtils'

const _getAwsClient = () =>
  new aws.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-19',
    region: ProcessUtils.ENV.cognitoRegion,
  })

const _sendAwsRequest = request =>
  new Promise((resolve, reject) => {
    request.send((err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

export const inviteUser = (email, temporaryPassword) => {
  const params = {
    UserPoolId: ProcessUtils.ENV.cognitoUserPoolId,
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

export const updateUser = (oldEmail, email, name) => {
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
    UserPoolId: ProcessUtils.ENV.cognitoUserPoolId
  }

  return _sendAwsRequest(_getAwsClient().adminUpdateUserAttributes(params))
}

export const deleteUser = email => {
  const params = {
    UserPoolId: ProcessUtils.ENV.cognitoUserPoolId,
    Username: email
  }
  return _sendAwsRequest(_getAwsClient().adminDeleteUser(params))
}
