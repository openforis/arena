import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

// ===== Header
export const gotoSurveyCreate = () =>
  test('Goto survey create', async () => {
    await page.click(getSelector(DataTestId.header.userBtn, 'button'))
    await page.click(getSelector(DataTestId.header.surveyCreateBtn, 'a'))
    expect(page.url()).toBe('http://localhost:9090/app/home/surveyNew/')
  })

export const gotoSurveyList = () =>
  test('Goto survey list', async () => {
    await page.click(getSelector(DataTestId.header.userBtn, 'button'))
    await page.click(getSelector(DataTestId.header.surveyListBtn, 'a'))
    expect(page.url()).toBe('http://localhost:9090/app/home/surveys/')
  })

// ==== Dashboard
export const gotoSurveyInfo = () =>
  test('Goto survey create', async () => {
    await page.goto('http://localhost:9090/app/home/dashboard/')
    await page.click(getSelector(DataTestId.dashboard.surveyInfoBtn, 'a'))
    expect(page.url()).toBe('http://localhost:9090/app/home/surveyInfo/')
  })

// ==== Sidebar
export const gotoHome = () =>
  test('Goto home', async () => {
    await page.click(getSelector(DataTestId.sidebar.moduleBtn('home'), 'a'))
    expect(page.url()).toBe('http://localhost:9090/app/home/dashboard/')
  })

const _gotoSubModule = (module, subModule, waitForApiPaths = null) => () =>
  test(`Goto ${module}->${subModule}`, async () => {
    await page.hover(getSelector(DataTestId.sidebar.module(module)))

    await Promise.all([
      ...(waitForApiPaths ? waitForApiPaths.map((path) => page.waitForResponse(path)) : []),
      page.waitForNavigation(),
      page.click(getSelector(DataTestId.sidebar.moduleBtn(subModule), 'a')),
    ])
    expect(page.url()).toBe(`http://localhost:9090/app/${module}/${subModule}/`)
  })

export const gotoFormDesigner = _gotoSubModule('designer', 'formDesigner')

export const gotoRecords = _gotoSubModule('data', 'records')

export const gotoValidationReport = _gotoSubModule('data', 'validationReport', [
  '**/validationReport**',
  '**/validationReport/count**',
])

export const gotoUserList = _gotoSubModule('users', 'userList')
