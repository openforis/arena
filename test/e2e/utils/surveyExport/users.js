import path from 'path'

import { checkFileAndGetContent } from './utils'

export const checkUsers = async ({
  surveyExtractedPath,
  numberOfUsers = 2,
  expectedUsers = ['test@arena.com', 'testtwo@arena.com'],
}) => {
  const users = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'users', 'users.json'),
  })

  await expect(users.length).toBe(numberOfUsers)

  await Promise.all(
    expectedUsers.map(async (expectedUser) => {
      const tester = users.find((_user) => _user.email === expectedUser)
      await expect(tester).toBeTruthy()
    })
  )
}
