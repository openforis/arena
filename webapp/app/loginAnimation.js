import {
  TimelineMax,
  Bounce,
  Elastic,
  Back
} from 'gsap/TweenMax'

const key = 'login'

// ======================
// ENTER
// ======================
// const tlEnter = new TimelineMax()
let tlEnter = null

const tlEnterKill = () => tlEnter ? tlEnter.kill() : null

const tlEnterInit = () => {
  tlEnterKill()

  tlEnter = new TimelineMax({pause: true})
  tlEnter.set('.login__container', {opacity: 1})
  tlEnter.set('.login__bg2', {scale: 1, opacity: 1})

// letters animation
  for (let el of document.getElementsByClassName('of-logo')) {
    tlEnter.from(el, .5,
      {
        rotationY: 180,
        opacity: 0,
        top: '-100px',
        ease: Bounce.easeIn
      }
    )
  }
// background images
  tlEnter
  // .from('.login__form-container', .5,
  //   {
  //     backgroundColor: bgColorStart,
  //     // borderColor: 'rgb(50, 42, 39)',
  //     ease: Power4.easeIn
  //   },
  //   1.5
  // )
  // .from('.cell', 1,
  //   {
  //     backgroundColor: bgColorStart,
  //     ease: Power4.easeIn
  //   }
  //   , 1)
    .to('.login__bg2', 6,
      {
        scaleX: 1.1,
        scaleY: 1.1,
        opacity: 0.7,
        repeat: -1,
        yoyo: true,
        // ease: SlowMo.ease.config(0.5, 0.4, false)
        ease: Back.easeOut.config(4)
      }, '-=2')
    .from('.login__form', 1,
      {
        top: -1000,
        // ease: Bounce.easeOut,
        ease: Elastic.easeOut.config(1.75, 0.75),
      }
      , '-=6')
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

const tlExitKill = () => tlExit ? tlExit.kill() : null

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