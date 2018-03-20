/**
 * 
 * @param {Component} instance 
 * @return Component[]
 */
export function getInstances(instance) {
  const instances = [instance] 

  while(instance = instance.parentInstance) {
    instances.push(instance.parentInstance)
  }

  return instances
}


export function extend(target, source = {}) {
  for (const name in source) {
    if (source.hasOwnProperty(name)) {
      target[name] = source[name]
      
    }
  }
}

export function isComponent(type) {
  return typeof type === 'function'
}
var lowerCache = {}

export function toLowerCase(s) {
    return lowerCache[s] || (lowerCache[s] = s.toLowerCase())
}
export function isSameType(dom, vnode) {
  if (dom['__type']) {
    return dom['__type'] === vnode.type
  }
  return toLowerCase(dom.nodeName)  === vnode.type
}

export function matchInstance(instance, Type) {
  do {
    if (instance instanceof Type) {
      return instance
    }
  } while (instance = instance.parentInstance);
}