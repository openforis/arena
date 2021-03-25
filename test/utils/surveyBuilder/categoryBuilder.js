import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

export class CategoryBuilder {
  constructor(name, ...itemBuilders) {
    this.name = name
    this.itemBuilders = itemBuilders
    this.levelNames = []
  }

  level(levelName) {
    this.levelNames.push(levelName)
    return this
  }

  build() {
    let category = Category.newCategory({ [Category.keysProps.name]: this.name })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.map((levelName) =>
        Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName })
      )
      category = Category.assocLevelsArray(levels)(category)
    }
    const items = this.itemBuilders.flatMap((itemBuilder) => itemBuilder.build(category))

    return {
      category,
      items,
    }
  }
}
