import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { user, user2 } from '../mock/user'
import { gotoUserList, gotoHome } from './_navigation'

const expectUsers = (users) => {
  test(`Verify users to be ${users.length}`, async () => {
    const rowsSelector = getSelector(DataTestId.table.rows(DataTestId.userList.users))
    await page.waitForSelector(rowsSelector)
    const rows = await page.$$(`${rowsSelector} div.table__row`)
    await expect(rows.length).toBe(users.length)
  })

  test.each(users)(`Verify user %p`, async (email, group) => {
    const emailSelector = `${getSelector(DataTestId.userList.email)}[data-value="${email}"]`
    const groupSelector = `${getSelector(DataTestId.userList.authGroup)}`
    const groupEl = await page.waitForSelector(`${emailSelector} + ${groupSelector}`)
    await expect(await groupEl.getAttribute('data-value')).toBe(group)
  })
}

const inviteUser = (userToInvite) =>
  test(`Invite user`, async () => {
    await page.click(getSelector(DataTestId.userList.inviteBtn, 'a'))

    await page.fill(getSelector(DataTestId.userInvite.email, 'input'), userToInvite.email)

    await page.click(getSelector(DataTestId.dropdown.toggleBtn(DataTestId.userInvite.group), 'button'))
    await page.click(`text="${userToInvite.authGroup.label}"`)

    await Promise.all([
      page.waitForNavigation(),
      page.waitForResponse('**/users/invite'),
      page.click(getSelector(DataTestId.userInvite.submitBtn, 'button')),
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
