import { waitFor, reload, expectToBe, click, writeIntoTextBox, getElement } from '../utils/api'

import { clickSidebarBtnUsersList } from '../utils/ui/sidebar'

describe('Invite user', () => {
  test('Open users', async () => {
    await reload()
    await waitFor(5000)

    await clickSidebarBtnUsersList()
    await waitFor(5000)
  })
  test('Has one user', async () => {
    await expectToBe({ selector: '.users-list__cell-profile-picture', numberOfItems: 1 })
    await expectToBe({ text: 'test@arena.com' })
  })

  test('Add user', async () => {
    await click('Invite')
    await writeIntoTextBox({ text: 'testtwo@arena.com', selector: { placeholder: 'Email' } })

    await click(await getElement({ selector: '.dropdown' }))

    await click('Survey administrators')
    await click('Send invitation')
  })

  test('Has two users', async () => {
    await waitFor(10000)
    await expectToBe({ selector: '.users-list__cell-profile-picture', numberOfItems: 2 })
    await expectToBe({ text: 'test@arena.com' })
    await expectToBe({ text: 'testtwo@arena.com' })
  })
})
