import * as User from '@core/user/user'
import { QRCodeAuthRepository } from '../repository/qrCodeAuthRepository'
import * as UserService from '../../user/service/userService'

/**
 * Generates a QR code authentication token for a user.
 *
 * @param {object} user - The user object.
 * @returns {Promise<object>} Object containing token and expiresAt.
 */
export const generateQRCodeToken = async (user) => {
  const userUuid = User.getUuid(user)

  // Delete any existing tokens for this user before creating a new one
  await QRCodeAuthRepository.deleteTokensByUserUuid({ userUuid })

  // Create new token
  const { token, expiresAt } = await QRCodeAuthRepository.insertToken({ userUuid })

  return { token, expiresAt }
}

/**
 * Validates a QR code token and returns the associated user.
 *
 * @param {string} token - The QR code token to validate.
 * @returns {Promise<object>} Object with valid flag, user (if valid), and error message (if invalid).
 */
export const validateQRCodeToken = async (token) => {
  if (!token) {
    return { valid: false, error: 'Token is required' }
  }

  const userUuid = await QRCodeAuthRepository.findUserUuidByToken({ token })

  if (!userUuid) {
    return { valid: false, error: 'Invalid or expired token' }
  }

  // Delete the token after successful validation (one-time use)
  await QRCodeAuthRepository.deleteToken({ token })

  // Fetch the user
  const user = await UserService.fetchUserByUuid(userUuid)

  if (!user) {
    return { valid: false, error: 'User not found' }
  }

  return { valid: true, user }
}

/**
 * Cleans up expired QR code tokens.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete.
 */
export const cleanupExpiredTokens = async () => {
  await QRCodeAuthRepository.deleteExpiredTokens()
}
