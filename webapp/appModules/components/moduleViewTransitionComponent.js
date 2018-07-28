import React from 'react'
import { Transition } from 'react-transition-group'

import { appModules } from '../appModules'

import { TimelineMax, Elastic } from 'gsap/TweenMax'
import { getViewportDimensions } from '../../app-utils/domUtils'
import { appModulesPath } from '../appModules'

const duration = 0.5
const ease = Elastic.easeOut.config(1, 0.8)

class ModuleViewTransitionComponent extends React.Component {

  constructor (props) {
    super(props)
    this.state = {mounted: false}

    this.enter = this.enter.bind(this)
    this.exit = this.exit.bind(this)

    this.tweenEnter = null
    this.tweenExit = null
    this.initTweenEnter = this.initTweenEnter.bind(this)
    this.initTweenExit = this.initTweenExit.bind(this)
  }

  getRightPosition () {
    const {module} = this.props
    const {width} = getViewportDimensions()

    return module === appModules.home
      ? (width)
      : -(width)
  }

  initTweenEnter (node) {
    if (!this.tweenEnter) {
      this.tweenEnter = new TimelineMax({paused: true})
      this.tweenEnter.to(node, duration, {opacity: 1, display: '', ease})
      // this.tweenEnter.to(node, duration, {right: 0, display: '', ease})
    }
  }

  initTweenExit (node) {
    if (!this.tweenExit) {
      this.tweenExit = new TimelineMax({paused: true})
      this.tweenExit.to(node, duration, {opacity:0,display: 'none'})
      // this.tweenExit.to(node, duration, {
      //   right: this.getRightPosition(),
      //   display: 'none',
      //   ease,
      //   //let's leave it mounted for now
      //   // onComplete: () => this.setState({mounted: false})
      // })
    }
  }

  checkMountedState () {
    if (!this.state.mounted)
      this.setState({mounted: true})
  }

  pauseTween (tween) {
    if (tween)
      tween.pause()
  }

  enter (node, isAppearing) {
    this.checkMountedState()

    this.pauseTween(this.tweenExit)

    //inner component added on initial mount
    if (isAppearing) {
      // node.style.right = '0px'
      node.style.display = ''
    } else {
      this.tweenEnter.restart()
    }
  }

  exit (node) {
    this.pauseTween(this.tweenEnter)

    this.tweenExit.restart()
  }

  render () {
    const {pathname, module, component} = this.props

    const matches = appModulesPath.matches(pathname, module)

    return (

      <Transition
        in={matches}
        key={module}
        appear={true}
        timeout={(duration * 1000)}
        // unmountOnExit={true}
        onEnter={this.initTweenEnter}
        onEntering={this.enter}
        onExit={this.initTweenExit}
        onExiting={this.exit}>


        <div ref="node"
             className="app-module"
             style={{
               display: 'none',
               // right: this.getRightPosition()
             }}>
          {
            this.state.mounted
              ? (
                React.createElement(component)
              )
              : (null)
          }
        </div>


      </Transition>
    )

  }
}

export default ModuleViewTransitionComponent