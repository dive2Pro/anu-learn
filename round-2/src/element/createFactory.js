import {createElement} from './index'
export default function createElementFactory(type, props) {

  var factory =  createElement.bind(null, type, props)

  factory.type = type
  return factory
}