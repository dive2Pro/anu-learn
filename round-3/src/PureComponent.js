import {Component} from './Component'
import {shallowEqual} from './shallowEqual'
export function PureComponent(props, context) {
  this.props = props
  this.context = context
}

const fn = PureComponent.prototype = Object.create(Component.prototype)


fn.constructor = PureComponent

fn.shouldComponentUpdate = function shouldUpdate(nextProps, nextState) {
  const a = shallowEqual(this.props, nextProps)
  const b = shallowEqual(this.state, nextState)

  return !a || !b
}

