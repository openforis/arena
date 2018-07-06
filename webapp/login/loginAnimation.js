import {
  TimelineMax,
  Bounce,
  Elastic,
  Back
} from 'gsap/TweenMax'

import {kill} from '../app-utils/gsapUtils'

const key = 'login'

// ======================
// ENTER
// ======================
// const tlEnter = new TimelineMax()
let tlEnter = null

const tlEnterKill = () => kill(tlEnter)

const tlEnterInit = () => {
  tlEnterKill()

  tlEnter = new TimelineMax({pause: true})
  tlEnter.set('.login__container', {opacity: 1})
  tlEnter.set('.login__bg2', {scale: 1.3, scaleY: 1.3})
  tlEnter.set('.of-letter', {position: 'relative'})

  // ofLetters animation
  for (let el of document.getElementsByClassName('of-letter')) {
    tlEnter.from(el, .5, {
      rotationY: 180,
      opacity: 0,
      top: '-100%',
      ease: Bounce.easeIn
    })
  }

  tlEnter.add('ofLettersEnd')

  // login boxes
  const start = 'ofLettersEnd-=3'
  tlEnter
    .from('.login__form', 2,
      {
        top: -1000,
        // ease: Bounce.easeOut,
        ease: Elastic.easeOut.config(1.75, 0.75)
      }
      , start)
  tlEnter.add('loginFormEnd')


  tlEnter.to('.login__form-box', 2, {
    border: '3px double rgba(50, 42, 39, 0.5)',
    ease: Back.easeIn.config(4)
  }, start)

  tlEnter.to('.login__form-container', 3, {
    backgroundColor: 'rgba(239, 155, 155, 0.0)',
    ease: Elastic.easeOut.config(1, 0.3)
  }, start)

  //background image overlay
    .to('.login__bg2', 12,
      {
        scaleX: 1.6,
        scaleY: 1.6,
        opacity: 0.7,
        repeat: -1,
        yoyo: true,
        ease: Back.easeOut.config(4)
      }, start)
  // }
}

const onEnter = (node, isAppearing) => {
  tlEnterInit()
  tlEnter.restart()
}

// ======================
// EXIT
// ======================
let tlExit = null

const tlExitKill = () => kill(tlExit)

const tlExitInit = () => {
  tlExitKill()

  tlExit = new TimelineMax({pause: true})
  tlExit.to('.login__container ', 2, {opacity: 0})
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