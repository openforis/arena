import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoSurveyUsersList } from './_navigation'

const expectUser = async ({ user }) => {
  await expect(page).toHaveText(user)
}

const expectUsers = ({ users }) => {
  test(`Invite User and check`, async () => {
    await Promise.all([users.map(async (user) => expectUser({ user }))])
  })
}

const inviteUser = () => {
  test(`Invite User and check`, async () => {
    await page.click(getSelector(DataTestId.userList.inviteBtn, 'a'))

    await page.fill(getSelector(DataTestId.userList.email, 'input'), 'testtwo@arena.com')

    await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.userList.group), 'button'))
    await page.click(`text="Survey administrators"`)

    await page.click(getSelector(DataTestId.userList.submitBtn, 'button'))
    await page.waitForTimeout(2000)
  })
}

export default () =>
  describe('Invite user', () => {
    gotoSurveyUsersList()
    expectUsers({ users: ['test@arena.com'] })

    inviteUser()

    expectUsers({ users: ['test@arena.com', 'testtwo@arena.com'] })
  })
