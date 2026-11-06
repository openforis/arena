import path from 'node:path'

import { Locator, Page } from '@playwright/test'

// set WHATS_NEW_SCREENSHOTS_DIR to save the screenshots used in the "What's new" dialog (see core/whatsNew/README.md)
const screenshotsDir = process.env.WHATS_NEW_SCREENSHOTS_DIR

export const savingWhatsNewScreenshots = !!screenshotsDir

type ImageType = 'png' | 'jpeg'

// floating elements not part of the feature shown
const style = '.ai-chatbot-fab { display: none; }'

const screenshotPath = (name: string, type: ImageType = 'png'): string =>
  path.join(screenshotsDir!, `${name}.${type === 'jpeg' ? 'jpg' : 'png'}`)

/**
 * Waits for the map tiles to be loaded (from the internet: missing ones are left out), only if saving the screenshots.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the tiles are loaded or after the timeout.
 */
export const waitForMapTiles = async (page: Page): Promise<void> => {
  if (!screenshotsDir) return
  await page
    .waitForFunction(
      () => !document.querySelector('.leaflet-tile-pane img.leaflet-tile:not(.leaflet-tile-loaded)'),
      undefined,
      { timeout: 30_000 }
    )
    .catch(() => undefined)
}

/**
 * Saves a screenshot of an element, if WHATS_NEW_SCREENSHOTS_DIR is set.
 * @param {Locator} locator - The element.
 * @param {string} name - The file name, without extension.
 * @returns {Promise<void>} Resolves when the screenshot is saved.
 */
export const saveScreenshot = async (locator: Locator, name: string): Promise<void> => {
  if (screenshotsDir) await locator.screenshot({ path: screenshotPath(name), style })
}

/**
 * Saves a screenshot of the page area containing the specified elements, with some margin (e.g. for tooltips below them),
 * if WHATS_NEW_SCREENSHOTS_DIR is set.
 * @param {object} params - The parameters.
 * @param {Page} params.page - The page.
 * @param {Locator[]} params.locators - The elements to include.
 * @param {string} params.name - The file name, without extension.
 * @param {number} [params.marginBottom] - Extra margin below the elements, in pixels.
 * @param {number} [params.marginRight] - Extra margin on the right of the elements, in pixels.
 * @param {number} [params.maxHeight] - Maximum height, in pixels (the bottom is cut).
 * @param {ImageType} [params.type] - The image type: jpeg for photo-like content (e.g. satellite imagery), much smaller.
 * @returns {Promise<void>} Resolves when the screenshot is saved.
 */
export const saveAreaScreenshot = async ({
  page,
  locators,
  name,
  marginBottom = 0,
  marginRight = 0,
  maxHeight = Infinity,
  type = 'png',
}: {
  page: Page
  locators: Locator[]
  name: string
  marginBottom?: number
  marginRight?: number
  maxHeight?: number
  type?: ImageType
}): Promise<void> => {
  if (!screenshotsDir) return
  const boxes = (await Promise.all(locators.map((locator) => locator.boundingBox()))).filter((box) => !!box)
  const margin = 10
  const x = Math.max(0, Math.min(...boxes.map((box) => box.x)) - margin)
  const y = Math.max(0, Math.min(...boxes.map((box) => box.y)) - margin)
  const right = Math.max(...boxes.map((box) => box.x + box.width)) + margin + marginRight
  const bottom = Math.min(Math.max(...boxes.map((box) => box.y + box.height)) + margin + marginBottom, y + maxHeight)
  await page.screenshot({
    path: screenshotPath(name, type),
    clip: { x, y, width: right - x, height: bottom - y },
    style,
    ...(type === 'jpeg' ? { type, quality: 85 } : {}),
  })
}
