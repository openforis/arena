import { TimelineMax } from 'gsap/TweenMax'

const key = 'app'

// ======================
// ENTER
// ======================
let tlEnter = null

const tlEnterKill = () => tlEnter ? tlEnter.kill() : null

const tlEnterInit = () => {
  tlEnterKill()
  tlEnter = new TimelineMax({pause: true})
}

const onEnter = (node, isAppearing) => {
  tlEnterInit()
  tlEnter.restart()
}

// ======================
// EXIT
// ======================
let tlExit = null

const tlExitKill = () => tlExit ? tlExit.kill() : null

const tlExitInit = () => {
  tlExitKill()

  tlExit = new TimelineMax({pause: true})
  tlExit.to('.app__container ', 2, {opacity: 0})
}

const onExit = node => {
  tlEnterKill()
  tlExitInit()
  tlExit.restart()
}

export default {
  key,
  onEnter,
  onExit
}