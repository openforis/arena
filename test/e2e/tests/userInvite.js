import { TestId, getSelector } from '../../../webapp/utils/testId'
import { user, user2 } from '../mock/user'
import { gotoUserList, gotoHome } from './_navigation'

const expectUsers = (users) => {
  test(`Verify users to be ${users.length}`, async () => {
    const rowsSelector = getSelector(TestId.table.rows(TestId.userList.users))
    await page.waitForSelector(rowsSelector)
    const rows = await page.$$(`${rowsSelector} div.table__row`)
    await expect(rows.length).toBe(users.length)
  })

  test.each(users)(`Verify user %p`, async (email, group) => {
    const emailSelector = `${getSelector(TestId.userList.email)}[data-value="${email}"]`
    const groupSelector = `${getSelector(TestId.userList.authGroup)}`
    const groupEl = await page.waitForSelector(`${emailSelector} + ${groupSelector}`)
    await expect(await groupEl.getAttribute('data-value')).toBe(group)
  })
}

const inviteUser = (userToInvite) =>
  test(`Invite user`, async () => {
    await page.click(getSelector(TestId.userList.inviteBtn, 'a'))

    await page.fill(getSelector(TestId.userInvite.email, 'input'), userToInvite.email)

    await page.click(getSelector(TestId.dropdown.toggleBtn(TestId.userInvite.group), 'button'))
    await page.click(`text="${userToInvite.authGroup.label}"`)

    await Promise.all([
      page.waitForNavigation(),
      page.waitForResponse('**/users/invite'),
      page.click(getSelector(TestId.userInvite.submitBtn, 'button')),
    ])
  })

export default () =>
  describe('User invite', () => {
    gotoUserList()
    expectUsers([[user.email, user.authGroup.key]])

    inviteUser(user2)
    expectUsers([
      [user.email, user.authGroup.key],
      [user2.email, user2.authGroup.key],
    ])

    gotoHome()
  })
