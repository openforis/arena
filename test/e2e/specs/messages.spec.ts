import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { waitForJobEnd } from '../helpers/publish'
import { Urls } from '../helpers/urls'

test.describe('Messages', () => {
  let messageUuid: string | null = null

  test.afterEach(async ({ api }) => {
    if (messageUuid) await api.deleteMessageIfExists(messageUuid)
    messageUuid = null
  })

  test('sends a message shown as notification to the target user', async ({ page, testUser }) => {
    const subject = `E2E message ${Date.now()}`

    // messages are in the System Administration section
    await page.goto(Urls.home)
    await expect(page.getByTestId(TestId.sidebar.module('message_plural'))).toHaveCount(0)
    await page.getByTestId(TestId.sidebar.module('systemAdmin')).hover()
    await page.getByTestId(TestId.sidebar.moduleBtn('message_plural')).click()
    await expect(page).toHaveURL(Urls.messages)

    await page.getByRole('button', { name: 'New' }).click()
    await expect(page).toHaveURL(/\/app\/systemAdmin\/message\/[\w-]+\/$/)
    messageUuid = /message\/([\w-]+)\/$/.exec(page.url())![1]

    const subjectInput = page.locator('.message-details input').first()
    await subjectInput.fill(subject)
    await page
      .locator('.message-body-editor textarea:not([aria-hidden])')
      .fill(
        'Dear {{userTitleAndName}},\n\nPlease join the **Arena user meeting**: [register](https://example.org/register)'
      )
    await expect(page.locator('.message-body-preview strong')).toHaveText('Arena user meeting')

    // in app notification only (no emails), sent only to the test user (other workers must not see it)
    await page.getByRole('button', { name: 'Email', exact: true }).click()
    await page.getByRole('button', { name: 'Individual Users' }).click()
    await page.getByPlaceholder('Type an email address to include').fill(testUser.email)
    // the message is saved (debounced) after every change: wait for the last save before sending it
    const lastSave = page.waitForResponse((res) => res.request().method() === 'PUT' && res.url().endsWith(messageUuid!))
    await page.getByRole('button', { name: 'Add' }).click()
    await lastSave

    await page.getByRole('button', { name: 'Send Message' }).click()
    await page.getByRole('button', { name: 'Ok' }).click()
    expect(await waitForJobEnd(page)).toBe('succeeded')
    await page.getByRole('button', { name: 'Close' }).click()
    // a sent message cannot be edited anymore
    await expect(subjectInput).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Send Message' })).toHaveCount(0)

    // the notification is loaded when the app starts
    await page.reload()
    await page.locator('.app-header__user-controls button:has(.icon-bell)').click()
    await expect(page.locator('.panel-right').getByText(subject)).toBeVisible()
    const notificationBody = page.locator('.message-notification__body')
    await expect(notificationBody).toContainText(`Dear ${testUser.name},`)
    await expect(notificationBody.locator('strong')).toHaveText('Arena user meeting')
    const link = notificationBody.getByRole('link', { name: 'register' })
    await expect(link).toHaveAttribute('href', 'https://example.org/register')
    await expect(link).toHaveCSS('text-decoration-line', 'underline')

    // the message is listed as sent
    await page.goto(Urls.messages)
    await expect(page.getByText(subject)).toBeVisible()
  })
})
