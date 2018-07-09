import React from 'react'
import { connect } from 'react-redux'

import { login } from './../actions'

class LoginForm extends React.Component {

  render () {
    const {login, errorMessage} = this.props

    return <div className="login__form">

      <input ref="username" type='text' name='username' placeholder='Your email'/>
      <input ref="password" type='password' name='password' placeholder='Your password'/>
      {
        errorMessage
          ? <div className="error text-center">{errorMessage}</div>
          : null
      }
      <div className="buttons">
        <button type="button"
                className="btn btn-transparent btn-of"
                onClick={() => login(this.refs.username.value, this.refs.password.value)}>
          Login
        </button>
        <button type="button" className="btn btn-link btn-transparent">Password??</button>
      </div>
      {/*<Link to={'/app/a'}>*/}
      {/*<span style={{fontSize: '30px', color: 'white', zIndex: 200}}>LOGIN</span>*/}
      {/*</Link>*/}
    </div>
  }

}

const mapStateToProps = state => ({
  ...state.login
})

export default connect(mapStateToProps, {login})(LoginForm)