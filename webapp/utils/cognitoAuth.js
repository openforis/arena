import axios from 'axios'

import Amplify, { Auth } from 'aws-amplify'

Amplify.configure({
  Auth: {
    region: 'eu-west-1',
    userPoolId: __COGNITO_USER_POOL_ID__,
    userPoolWebClientId: __COGNITO_CLIENT_ID__,

    // OPTIONAL - Configuration for cookie storage
    // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    // cookieStorage: {
    //   // REQUIRED - Cookie domain (only required if cookieStorage is provided)
    //   domain: '.yourdomain.com',
    //   // OPTIONAL - Cookie path
    //   path: '/',
    //   // OPTIONAL - Cookie expiration in days
    //   expires: 365,
    //   // OPTIONAL - Cookie secure flag
    //   // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
    //   secure: true
    // },

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    // authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
})

// You can get the current config object
// const currentConfig = Auth.configure()

export const authenticate = async (username, password) => {
  try {
    const user = await Auth.signIn(username, password)

    if (user.challengeName === 'SMS_MFA' ||
      user.challengeName === 'SOFTWARE_TOKEN_MFA') {
      // // You need to get the code from the UI inputs
      // // and then trigger the following function with a button click
      // const code = getCodeFromUserInput()
      // // If MFA is enabled, sign-in should be confirmed with the confirmation code
      // const loggedUser = await Auth.confirmSignIn(
      //   user,   // Return object from Auth.signIn()
      //   code,   // Confirmation code
      //   mfaType // MFA Type e.g. SMS_MFA, SOFTWARE_TOKEN_MFA
      // )
    } else if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
      // const { requiredAttributes } = user.challengeParam; // the array of required attributes, e.g ['email', 'phone_number']
      // // You need to get the new password and required attributes from the UI inputs
      // // and then trigger the following function with a button click
      // // For example, the email and phone_number are required attributes
      // const { username, email, phone_number } = getInfoFromUserInput();
      // const loggedUser = await Auth.completeNewPassword(
      //   user,               // the Cognito User Object
      //   newPassword,       // the new password
      //   // OPTIONAL, the required attributes
      //   {
      //     email,
      //     phone_number,
      //   }
      // )
    } else if (user.challengeName === 'MFA_SETUP') {
    //   // This happens when the MFA method is TOTP
    //   // The user needs to setup the TOTP before using it
    //   // More info please check the Enabling MFA part
    //   Auth.setupTOTP(user)
    } else {
      // The user directly signs in
      const { data: { user: serverUser, survey } } = await axios.get('/auth/user')
      return { user: serverUser, survey }
    }
  } catch (err) {
    if (err.code === 'UserNotConfirmedException') {
      // The error happens if the user didn't finish the confirmation step when signing up
      // In this case you need to resend the code and confirm the user
      // About how to resend the code and confirm the user, please check the signUp part
    } else if (err.code === 'PasswordResetRequiredException') {
      // The error happens when the password is reset in the Cognito console
      // In this case you need to call forgotPassword to reset the password
      // Please check the Forgot Password part.
    } else if (err.code === 'NotAuthorizedException') {
      // The error happens when the incorrect password is provided
    } else if (err.code === 'UserNotFoundException') {
      // The error happens when the supplied username/email does not exist in the Cognito user pool
    } else {
      console.log(err) // TODO
    }

    throw err
  }
}

export const getJwtToken = async () => {
  const session = await Auth.currentSession()
  return session.getAccessToken().jwtToken
}