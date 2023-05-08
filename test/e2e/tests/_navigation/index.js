import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { BASE_URL } from '../../config'

// ===== Header
export const gotoSurveyCreate = () =>
  test('Goto survey create', async () => {
    await page.click(getSelector(TestId.header.userBtn, 'button'))
    await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.header.surveyCreateBtn, 'a'))])
    expect(page.url()).toBe(`${BASE_URL}/app/home/surveyNew/`)
  })

export const gotoSurveyList = () =>
  test('Goto survey list', async () => {
    await page.click(getSelector(TestId.header.userBtn, 'button'))
    await page.click(getSelector(TestId.header.surveyListBtn, 'a'))
    expect(page.url()).toBe(`${BASE_URL}/app/home/surveys/`)
  })

export const gotoTemplateCreate = () =>
  test('Goto template create', async () => {
    await page.click(getSelector(TestId.header.userBtn, 'button'))
    await Promise.all([page.waitForNavigation(), page.click(getSelector(TestId.header.templateCreateBtn, 'a'))])
    expect(page.url()).toBe(`${BASE_URL}/app/home/templateNew/`)
  })

export const gotoTemplateList = () =>
  test('Goto template list', async () => {
    await page.click(getSelector(TestId.header.userBtn, 'button'))
    await page.click(getSelector(TestId.header.templateListBtn, 'a'))
    expect(page.url()).toBe(`${BASE_URL}/app/home/templates/`)
  })

// ==== Dashboard
export const gotoSurveyInfo = () =>
  test('Goto survey info', async () => {
    await page.goto(`${BASE_URL}/app/home/dashboard/`)
    await page.click(getSelector(TestId.dashboard.surveyInfoBtn, 'a'))
    expect(page.url()).toBe(`${BASE_URL}/app/home/surveyInfo/`)
  })

// ==== Sidebar
export const gotoHome = () =>
  test('Goto home', async () => {
    const currentUrl = await page.url()
    const homeUrl = `${BASE_URL}/app/home/`
    const dashboardUrl = `${homeUrl}dashboard/`
    if (currentUrl !== dashboardUrl) {
      await page.click(getSelector(TestId.sidebar.moduleBtn('home'), 'a'))
    }
    // page url could be /home/dashboard or /home (redirection to dashboard not performed yet)
    expect([homeUrl, dashboardUrl]).toContain(page.url())
  })

const _gotoSubModule =
  (module, subModule, waitForApiPaths = null) =>
  () =>
    test(`Goto ${module}->${subModule}`, async () => {
      await page.mouse.move(0, 0, { steps: 1 })

      // give time for module popup to close (if open)
      await page.waitForTimeout(1000)

      const moduleSelector = getSelector(TestId.sidebar.module(module))
      await page.waitForSelector(moduleSelector, { timeout: 5000 })
      await page.hover(moduleSelector)

      const subModuleSelector = getSelector(TestId.sidebar.moduleBtn(subModule), 'a')
      await page.waitForSelector(subModuleSelector, { timeout: 5000 })

      await Promise.all([
        ...(waitForApiPaths ? waitForApiPaths.map((path) => page.waitForResponse(path)) : []),
        page.waitForNavigation(),
        page.click(subModuleSelector),
      ])

      expect(page.url()).toBe(`${BASE_URL}/app/${module}/${subModule}/`)
    })

export const gotoFormDesigner = _gotoSubModule('designer', 'formDesigner')

export const gotoRecords = _gotoSubModule('data', 'records')

export const gotoDataExport = _gotoSubModule('data', 'export')

export const gotoValidationReport = _gotoSubModule('data', 'validationReport', [
  '**/validationReport**',
  '**/validationReport/count**',
])

export const gotoUserList = _gotoSubModule('users', 'userList')

export const gotoEntities = _gotoSubModule('analysis', 'entities')
