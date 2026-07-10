import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

export class CategoryBuilder {
  constructor(name) {
    this.name = name
    this.childItemBuilders = []
    this.levelNames = []
    this._extraProps = {}
  }

  levels(...levelNames) {
    this.levelNames = [...levelNames]
    return this
  }

  items(...itemBuilders) {
    this.childItemBuilders = [...itemBuilders]
    return this
  }

  extraProps(extraPropsDefs) {
    this._extraProps = extraPropsDefs
    return this
  }

  build() {
    // Memoized: build() can be called multiple times (once to wire the in-memory survey,
    // once more from buildAndStore() to persist it) and must return the same category/uuid every time.
    if (this._built) return this._built

    let category = Category.newCategory({
      [Category.keysProps.name]: this.name,
      [Category.keysProps.itemExtraDef]: this._extraProps,
    })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.map((levelName, index) =>
        Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index)
      )
      category = Category.assocLevelsArray(levels)(category)
    }
    const items = this.childItemBuilders.flatMap((itemBuilder) => itemBuilder.build(category))

    this._built = {
      category,
      items,
    }
    return this._built
  }

  async buildAndStore(user, surveyId, t) {
    const { category, items } = this.build()
    await CategoryManager.insertCategory({ user, surveyId, category, system: false, validate: false }, t)
    if (items.length > 0) {
      await CategoryManager.insertItems(user, surveyId, items, t)
    }
  }

  async buildAndStore(user, surveyId, t) {
    const { category, items } = this.build()
    await CategoryManager.insertCategory({ user, surveyId, category, system: false, validate: false }, t)
    if (items.length > 0) {
      await CategoryManager.insertItems(user, surveyId, items, t)
    }
  }
}
