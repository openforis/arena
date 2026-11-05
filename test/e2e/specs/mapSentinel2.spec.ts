import type { Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { Urls } from '../helpers/urls'

const ids = TestId.mapWorkspace

// The scene index host. The offline tests make it unreachable, so they never depend on the network.
const SCENE_INDEX_URLS = 'https://data.source.coop/**'
// The drawn search area is a dotted outline (SCENE_DRAWN_AREA_STYLE).
const DRAWN_AREA_OUTLINE = 'path[stroke-dasharray="2 4"]'

/**
 * Makes every request to the scene index fail, as if the network were down.
 * @param {Page} page - The page.
 * @returns {Promise<{aborted: function(): number}>} Resolves once the route is set, with a counter of the aborted requests.
 */
const blockSceneIndex = async (page: Page): Promise<{ aborted: () => number }> => {
  let aborted = 0
  await page.route(SCENE_INDEX_URLS, (route) => {
    aborted += 1
    return route.abort()
  })
  return { aborted: () => aborted }
}

/**
 * Opens Data › Map and waits for the top bar (same helper as Part 1's mapWorkspace.spec.ts).
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the bar is shown.
 */
const openMap = async (page: Page): Promise<void> => {
  await page.goto(Urls.map)
  await expect(page.getByTestId(ids.toolbar)).toBeVisible()
  await expect(page.getByTestId(ids.menuButton('baseMap'))).toBeVisible()
}

/**
 * Opens Data › Map and flies to coordinates with the search box (zoom 14: one or two Sentinel-2 tiles in view).
 * @param {Page} page - The page.
 * @param {string} query - Coordinates, e.g. '41.9, 12.5'.
 * @returns {Promise<void>} Resolves at zoom 14.
 */
const goToCoordinates = async (page: Page, query: string): Promise<void> => {
  await openMap(page)
  await page.getByTestId(ids.searchInput).fill(query)
  await expect(page.getByTestId(ids.searchResult(0))).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId(ids.statusZoom)).toHaveText('Zoom 14')
}

/**
 * Opens the Sentinel-2 tab from the Imagery menu.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the panel is visible.
 */
const openScenesPanel = async (page: Page): Promise<void> => {
  await page.getByTestId(ids.menuButton('imagery')).click()
  await page.getByTestId(ids.menuItem('searchScenes')).click()
  await expect(page.getByTestId(ids.railPanel('scenes'))).toBeVisible()
  await expect(page.getByTestId(ids.scenesPanel)).toBeVisible()
}

/**
 * Returns a page point at an offset from the centre of the Leaflet map (south-east: away from the left rail,
 * the search marker at the centre and the zoom buttons at the bottom right).
 * @param {Page} page - The page.
 * @param {number} dx - Horizontal offset in pixels.
 * @param {number} dy - Vertical offset in pixels.
 * @returns {Promise<{x: number, y: number}>} The point in page coordinates.
 */
const mapPoint = async (page: Page, dx: number, dy: number): Promise<{ x: number; y: number }> => {
  const box = await page.locator('.leaflet-container').first().boundingBox()
  if (!box) throw new Error('The map is not visible')
  return { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
}

test.describe('Map Sentinel-2 scenes', () => {
  // the Imagery menu and the Sentinel-2 tab are experimental features
  test.use({ experimentalFeatures: true })

  test('opens from the Imagery menu with the default filters, before Legend', async ({ page, sampleSurvey: _ }) => {
    const { aborted } = await blockSceneIndex(page)
    await openMap(page)
    // A hidden panel never contacts the index, even when the view changes.
    const from = await mapPoint(page, 100, 100)
    const to = await mapPoint(page, 220, 160)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 5 })
    await page.mouse.up()
    await page.mouse.wheel(0, -300)
    // wait past the 800 ms view-bounds debounce, so a search would have started by now
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1200)))
    expect(aborted()).toBe(0)
    await openScenesPanel(page)

    await expect(page.getByTestId(ids.scenesArea('view'))).toHaveAttribute('aria-pressed', 'true')
    // no plot popup has been opened
    await expect(page.getByTestId(ids.scenesArea('plot'))).toBeDisabled()
    await expect(page.locator(`[data-testid^="${ids.scenesPeriod('')}"]`)).toHaveCount(3)
    await expect(page.getByTestId(ids.scenesPeriod(6))).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(ids.scenesRange)).toContainText('–')
    await expect(page.getByTestId(ids.scenesMaxCloud).getByRole('slider')).toHaveValue('20')
    await expect(page.getByTestId(ids.scenesMinCoverage).getByRole('slider')).toHaveValue('80')
    await expect(page.getByTestId(ids.scenesBands)).toHaveValue('trueColour')

    const tabIds = await page
      .locator(`[data-testid^="${ids.railTab('')}"]`)
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid')))
    expect(tabIds.indexOf(ids.railTab('scenes'))).toBeGreaterThan(-1)
    expect(tabIds.indexOf(ids.railTab('scenes'))).toBeLessThan(tabIds.indexOf(ids.railTab('legend')))
  })

  test('an unreachable index shows an error with Retry', async ({ page, sampleSurvey: _ }) => {
    const { aborted } = await blockSceneIndex(page)
    await goToCoordinates(page, '41.9, 12.5')
    await openScenesPanel(page)

    const message = page.getByTestId(ids.scenesMessage)
    await expect(message).toHaveText('The scene index could not be read.')
    const before = aborted()
    await page.getByTestId(ids.scenesRetry).click()
    // Retry sends new requests to the index
    await expect.poll(aborted).toBeGreaterThan(before)
    await expect(message).toHaveText('The scene index could not be read.')
    await expect(page.getByTestId(ids.scenesRetry)).toBeVisible()
  })

  test('draws a search area with two clicks and keeps its outline only for that area', async ({
    page,
    sampleSurvey: _,
  }) => {
    await blockSceneIndex(page)
    await goToCoordinates(page, '41.9, 12.5')
    await openScenesPanel(page)

    await page.getByTestId(ids.scenesArea('draw')).click()
    const message = page.getByTestId(ids.scenesMessage)
    await expect(message).toHaveText('Click two opposite corners on the map to draw the area.')

    const corner1 = await mapPoint(page, 40, 40)
    const corner2 = await mapPoint(page, 120, 100)
    await page.mouse.click(corner1.x, corner1.y)
    await page.mouse.click(corner2.x, corner2.y)

    await expect(page.locator(DRAWN_AREA_OUTLINE)).toHaveCount(1)
    await expect(page.getByTestId(ids.scenesDrawAgain)).toBeVisible()
    await expect(message).toHaveText('The scene index could not be read.')

    await page.getByTestId(ids.scenesArea('view')).click()
    await expect(page.locator(DRAWN_AREA_OUTLINE)).toHaveCount(0)
    await page.getByTestId(ids.scenesArea('draw')).click()
    // the earlier rectangle is kept: choosing the area again does not start a new drawing
    await expect(page.locator(DRAWN_AREA_OUTLINE)).toHaveCount(1)
  })

  test('finds recent scenes and adds one as a layer (network)', async ({ page, sampleSurvey: _ }) => {
    // skipped by default: it reads the public Sentinel-2 index over the network
    test.skip(!process.env.E2E_NETWORK, 'Reads the public Sentinel-2 index: run with E2E_NETWORK=1')
    test.setTimeout(180_000)
    await goToCoordinates(page, '-1.3, 36.8')
    await openScenesPanel(page)

    // widest filters, so a cloudy season still lists scenes
    const maxCloud = page.getByTestId(ids.scenesMaxCloud).getByRole('slider')
    await maxCloud.focus()
    await page.keyboard.press('End')
    await expect(maxCloud).toHaveValue('100')
    const minCoverage = page.getByTestId(ids.scenesMinCoverage).getByRole('slider')
    await minCoverage.focus()
    await page.keyboard.press('Home')
    await expect(minCoverage).toHaveValue('0')

    await expect(page.getByTestId(ids.scenesCount)).toHaveText(/^\d+ scenes?$/, { timeout: 120_000 })
    const firstRow = page.locator(`[data-testid^="${ids.sceneRow('')}"]`).first()
    await firstRow.getByRole('button').first().click()
    await firstRow.locator(`[data-testid^="${ids.sceneAddLayer('')}"]`).click()

    await page.getByTestId(ids.railTab('layers')).click()
    await expect(page.locator(`[data-testid^="${ids.overlayRow('s2:layer:trueColour:')}"]`)).toHaveCount(1, {
      timeout: 60_000,
    })
  })
})
