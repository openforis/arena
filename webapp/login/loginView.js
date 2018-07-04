import './style.scss'

import React from 'react'
import * as R from 'ramda'

import { TweenMax, Linear, TimelineMax, Bounce, SteppedEase, SlowMo, Elastic, Power4 } from 'gsap/TweenMax'

const noCols = 12
const noRows = 6
const cols = R.range(0, noCols)
const rows = R.range(0, noRows)

const noCells = noCols * noRows - 6 * 4 + 1
const cells = R.range(0, noCells)

const cellContent = {
  1: 'O',
  2: 'P',
  3: 'E',
  4: 'N',
  6: 'F',
  7: 'O',
  8: 'R',
  9: 'I',
  10: 'S'
}

const LoginForm = () => <div className="login__form">
  <input type='text' name='username' placeholder='Your email'/>
  <input type='password' name='password' placeholder='Your password'/>
  <button type="button" className="">Login</button>
  {/*<div className="login__form-header">Sign in with</div>*/}
  {/*<button className="justify-self-right">GOOGLE</button>*/}
  {/*<button className="justify-self-left">PASSWORD</button>*/}
</div>

class LoginView extends React.Component {

  componentDidMount () {
    // TweenMax.set('.cell', {
    //   // backgroundColor:function(i) {
    //   //   return colors[i % colors.length];
    //   // },
    //   x: function (i) {
    //     return i * 50
    //   }
    // })
    const w = 500
    // const w = window.innerWidth
    // TweenMax.to('.cell', 5, {
    //   ease: Linear.easeNone,
    //   x: '+=' + w, //move each box 500px to right
    //   modifiers: {
    //     x: function (x) {
    //       return x % w //force x value to be between 0 and 500 using modulus
    //     }
    //   },
    //   repeat: -1
    // })
    //

    const tl = new TimelineMax()

    const elements = document.getElementsByClassName('of-logo')
    let i = 0
    for (let el of elements) {
      tl.from(
        el,
        .25,
        // {
        //   rotationY: 180,
        //   // opacity: 0,
        //   // fontSize: '50px',
        //   // x:window.innerWidth/2,
        //   // y:window.innerHeight/2
        // },
        {
          rotationY: 180,
          opacity: 0,
          top: '-100px',
          // fontSize: '70px',
          // ease: SlowMo.ease.config(0.5, 0.7, false)
          ease: Bounce.easeIn
        },
        // (++i) * .3
      )
    }

    tl
      .from('.login__form-container',
      .5,
        {
          backgroundColor: 'rgb(50, 42, 39)',
          // borderColor: 'rgb(50, 42, 39)',
          ease: Power4.easeIn
        },
         1.5
      )
      .from('.cell', 1,
        {
          backgroundColor: 'rgb(50, 42, 39)',
          ease: Power4.easeIn
        }
        , 1)
      .from('.login__form', 1,
        {
          top: -1000,
          // ease: Bounce.easeOut,
          ease:  Elastic.easeOut.config(1.75, 0.75),
        }
          , '-=1')
    // tl
    // .to(frontCard, 1, {rotationY:180})
    //   .fromTo('.cell-content', 2, {rotationY: 180, opacity: 0}, {rotationY: 0, opacity: 1}, 2)
    //   .to('.cell-content', 2, {rotationY: 0, opacity: 1}, 0)
    // .to('.cell', 1, {z: 50}, 0)
    // .to('.cell', 1, {z: 0}, 1)
  }

  render () {
    return <div className="login__container height100">
      <div className="login__bg"/>

      <div className="login__grid">
        {
          cells.map(i => {
            const isLoginContainer = i === 15
            const content = cellContent[i]
            return (
              <div key={i}
                   className={`cell_${i} ${isLoginContainer ? 'login__form-container' : 'cell'}`}>
                {
                  isLoginContainer
                    ? <LoginForm/>
                    : <div className={`cell-content ${content ? 'of-logo' : ''}`}>{content}</div>
                }
              </div>
            )
          })

        }
      </div>

    </div>
  }
}

export default LoginView
