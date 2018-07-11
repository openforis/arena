import {
  TimelineMax,
  Bounce,
  Elastic,
  Back,
  Power0,
  Power4,
  RoughEase,
  SlowMo,
  SteppedEase
} from 'gsap/TweenMax'

import { kill } from '../app-utils/gsapUtils'

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
  tlEnter.set('.login__form', {opacity: 0})

  const start = 'ofLettersEnd-=3'

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

    .to('.login__form', 3, {
      // top: -1000,
      opacity: 1,
      ease: Bounce.easeOut,
      // ease: Bounce.easeOut
      // ease: Elastic.easeOut.config(1.75, 0.75)
    }, start)
    // .add('loginFormEnd')

    .to('.login__form-container', 1, {
      border: '3px double rgba(239, 155, 155, 0.08)',
      ease: Power0.easeIn
    }, start)
    //
    .to('.login__form-container', 3, {
      backgroundColor: 'rgba(239, 155, 155, 0.0)',
      ease: Elastic.easeOut.config(1, 0.3)
    }, start)
    //
    // .to('.login__form-container', 4, {
    //   boxShadow: 'inset 0px -8px 260px -50px rgba(222, 220, 203, 0.1);',
    // }, start)

    //background image overlay
    // .set('.login__bg2', {opacity: .9}, start)
    .to('.main__bg2', 12, {
      scaleX: 1.6,
      scaleY: 1.6,
      opacity: 0.65,
      repeat: -1,
      yoyo: true,
      // ease: RoughEase.ease.config({
      //   template: Power0.none,
      //   strength: 2,
      //   points: 10,
      //   taper: 'both',
      //   randomize: true,
      //   clamp: false
      // })
      // ease: Back.easeOut.config(4)
      // ease: Bounce.easeInOut
      ease: Power4.easeInOut
    }, start)

    .fromTo('.main__bg1', 6,
      {
        scaleX: 1.15,
        scaleY: 1.15,
        // rotationZ: -0.5,
        // '-webkit-filter': 'contrast(100%) brightness(100%)',
        // filter: 'contrast(100%) brightness(100%)',
      },
      {
        scaleX: 1.1,
        scaleY: 1.1,
        // rotationZ: 0.5,
        // '-webkit-filter': 'contrast(180%) brightness(150%)',
        // filter: 'contrast(180%) brightness(150%)',
        // opacity: 0.8,
        repeat: -1,
        yoyo: true,
        // ease: RoughEase.ease.config({
        //   template: Power0.easeNone,
        //   strength: 1,
        //   points: 10,
        //   taper: 'none',
        //   randomize: true,
        //   clamp: false
        // })
        // ease: Back.easeOut.config(4)
        // ease: SlowMo.ease.config(0.7, 0.7, false)
        ease: SteppedEase.config(40)
        // ease: RoughEase.ease.config({ template:  Power0.none, strength: 1, points: 200, taper: "both", randomize: true, clamp: false})
        // ease: Power4.easeInOut
      }, start)

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
  tlEnter.pause()
  tlEnter.progress(0)
  tlEnterKill()
  tlExitInit()
  tlExit.restart()
}

export default {
  key,
  onEnter,
  onExit
}