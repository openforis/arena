import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

export class CategoryBuilder {
  constructor(name) {
    this.name = name
    this.childItemBuilders = []
    this.levelNames = []
  }

  levels(...levelNames) {
    this.levelNames = [...levelNames]
    return this
  }

  items(...itemBuilders) {
    this.childItemBuilders = [...itemBuilders]
    return this
  }

  build() {
    let category = Category.newCategory({ [Category.keysProps.name]: this.name })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.map((levelName, index) =>
        Category.newLevel(category, { [CategoryLevel.keysProps.name]: levelName }, index)
      )
      category = Category.assocLevelsArray(levels)(category)
    }
    const items = this.childItemBuilders.flatMap((itemBuilder) => itemBuilder.build(category))

    return {
      category,
      items,
    }
  }
}
