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

const inviteUser = email => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    // Username and email are the same in our case
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
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

const sendEmail = async (from, to, subject, body) => {
  // aws.config.update({ region: process.env.COGNITO_REGION })

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

  // Create the promise and SES service object
  const sendPromise = new aws.SES({
    region: process.env.COGNITO_REGION,
    apiVersion: '2016-04-19'
  }).sendEmail(params).promise()

  // // Handle promise's fulfilled/rejected states
  // sendPromise.then(
  //   function (data) {
  //     console.log(data.MessageId)
  //   }).catch(err => {
  //   console.error(err, err.stack)
  // })

  return sendPromise
}

module.exports = {
  inviteUser,
  updateEmail,
  sendEmail,
}
