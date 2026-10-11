/**
 * Module introduction (suggestion 9): the modules it introduces and the English prompt of Do it.
 */
export type IntroModule = 'designer' | 'data' | 'analysis'

export const INTRO_MODULES: IntroModule[] = ['designer', 'data', 'analysis']

// how the prompt names each module (English, sent to the model)
export const MODULE_INTRO_LABELS: Record<IntroModule, string> = {
  designer: 'form designer',
  data: 'Data module',
  analysis: 'Analysis module',
}

/**
 * Returns true for a module that has an introduction.
 * @param {string} module - App module (first route segment after /app).
 * @returns {boolean} True when introduced.
 */
export const isIntroModule = (module: string): module is IntroModule => INTRO_MODULES.some((item) => item === module)

/**
 * Returns the prompt of the introduction of a module.
 * @param {IntroModule} module - Module.
 * @returns {string} The prompt.
 */
export const buildModuleIntroPrompt = (module: IntroModule): string =>
  `I'm new to the ${MODULE_INTRO_LABELS[module]}. Explain what it is for and the main steps to get started, using the Arena manual.`
