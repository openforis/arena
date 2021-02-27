import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoUserList, gotoHome } from './_navigation'

const expectUser = async ({ user, index }) => {
  const emails = await page.$$(getSelector(DataTestId.userList.email, 'div'))
  const value = await emails[index].innerText()
  await expect(value).toBe(user)
}

const expectUsers = ({ users }) =>
  test(`Check users ${users.length}`, async () => {
    await page.reload()
    await page.waitForSelector(getSelector(DataTestId.userList.email, 'div'))
    await Promise.all(users.map(async (user, index) => expectUser({ user, index })))
  })

const inviteUser = () =>
  test(`Invite user`, async () => {
    await page.click(getSelector(DataTestId.userList.inviteBtn, 'a'))

    await page.fill(getSelector(DataTestId.userInvite.email, 'input'), 'testtwo@arena.com')

    await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.userInvite.group), 'button'))
    await page.click(`text="Survey administrators"`)

    await Promise.all([
      page.waitForResponse('**/users/invite'),
      page.click(getSelector(DataTestId.userInvite.submitBtn, 'button')),
    ])
  })

export default () =>
  describe('Invite user testtwo@arena.com', () => {
    gotoUserList()
    expectUsers({ users: ['test@arena.com'] })

    inviteUser()

    expectUsers({ users: ['test@arena.com', 'testtwo@arena.com'] })

    gotoHome()
  })
