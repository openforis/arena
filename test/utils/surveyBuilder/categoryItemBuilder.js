import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as CategoryLevel from '@core/survey/categoryLevel'

export class ItemBuilder {
  constructor(code) {
    this.code = code
    this._label = ''
    this.extraProps = {}
    this.childItemBuilders = []
  }

  label(label) {
    this._label = label
    return this
  }

  extra(extraProps) {
    this.extraProps = extraProps
    return this
  }

  item(itemBuilder) {
    this.childItemBuilders.push(itemBuilder)
    return this
  }

  build(category, parentItem = null, levelIndex = 0) {
    const level = Category.getLevelByIndex(levelIndex)(category)
    const item = CategoryItem.newItem(CategoryLevel.getUuid(level), CategoryItem.getUuid(parentItem), {
      [CategoryItem.keysProps.code]: this.code,
      [CategoryItem.keysProps.labels]: { en: this._label },
      [CategoryItem.keysProps.extra]: this.extraProps,
    })
    const descendants = this.childItemBuilders.flatMap((childItemBuilder) =>
      childItemBuilder.build(category, item, levelIndex + 1)
    )
    return [item, ...descendants]
  }
}
