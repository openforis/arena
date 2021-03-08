const getParent = async (el) => el.$('xpath=..')

export const dragAndDropOver = async ({ targetEl, sourceEl, to }) => {
  const EVENT_TYPES = {
    DRAG_END: 'dragend',
    DRAG_START: 'dragstart',
    DRAG_OVER: 'dragover',
    DROP: 'drop',
  }
  const targetParent = await getParent(targetEl)
  const sourceParent = await getParent(sourceEl)

  const dataTransfer = await targetParent.evaluateHandle(() => new DataTransfer())
  await targetParent.dispatchEvent(EVENT_TYPES.DRAG_START, { dataTransfer })
  await sourceParent.dispatchEvent(EVENT_TYPES.DRAG_OVER, { clientX: to.x, clientY: to.y })
  await targetParent.dispatchEvent(EVENT_TYPES.DRAG_END)
}

export const dragAndDrop = async (fromX, fromY, toX, toY, options = { steps: 1 }) => {
  await page.mouse.move(fromX, fromY, options)
  await page.mouse.down()
  await page.mouse.move(toX, toY, options)
  await page.mouse.up()
}
