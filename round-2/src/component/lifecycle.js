var componentHooks = {
  '0': 'componentWillMount',
  '1': 'componentDidMount',
  '2': 'componentWillReceiveProps',
  '3': 'shouldComponentUpdate', //componentShouldUpdate
  '4': 'componentWillUpdate',
  '5': 'componentDidUpdate',
  '6': 'componentWillUnmount',
  '-2': 'getDefaultProps',
  '-1': 'getInitialState'
}

/**
 * lifecycle invoker
 * @param {Component | Function} instance 
 * @param {number} index 
 */
export function applyComponentHook(el, index) {
  var hook = componentHooks[index]  
  if(el && el[hook]) {
    el[hook].apply(el, Array.prototype.slice.call(arguments, 2))
  }
}