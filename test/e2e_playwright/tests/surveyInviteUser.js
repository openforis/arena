import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoSurveyUsersList } from './_navigation'

const expectUser = async ({ user }) => {
  await expect(page).toHaveText(user)
}

const expectUsers = ({ users }) => {
  test(`Check users ${users.length}`, async () => {
    await page.reload()
    await Promise.all(users.map(async (user) => expectUser({ user })))
  })
}

const inviteUser = () => {
  test(`Invite user`, async () => {
    await page.click(getSelector(DataTestId.userList.inviteBtn, 'a'))

    await page.fill(getSelector(DataTestId.userList.email, 'input'), 'testtwo@arena.com')

    await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.userList.group), 'button'))
    await page.click(`text="Survey administrators"`)

    await page.click(getSelector(DataTestId.userList.submitBtn, 'button'))
    await page.waitForTimeout(2500)
  })
}

export default () =>
  describe('Invite user testtwo@arena.com', () => {
    gotoSurveyUsersList()
    expectUsers({ users: ['test@arena.com'] })

    inviteUser()

    expectUsers({ users: ['test@arena.com', 'testtwo@arena.com'] })
  })
