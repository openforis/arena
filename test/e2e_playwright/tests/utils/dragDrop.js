export const dragAndDrop = async (fromX, fromY, toX, toY, options = { steps: 1 }) => {
  await page.mouse.move(fromX, fromY, options)
  await page.mouse.down()
  await page.mouse.move(toX, toY, options)
  await page.mouse.up()
}
