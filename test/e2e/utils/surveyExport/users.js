import path from 'path'
import * as User from '@core/user/user'

import { checkFileAndGetContent } from './utils'

export const checkUsers = async ({ surveyExtractedPath }) => {
  const users = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'users', 'users.json'),
  })

  await expect(users.length).toBe(1)

  const tester = users.find((_user) => User.getEmail(_user) === 'test@arena.com')
  await expect(tester).toBeTruthy()
}
