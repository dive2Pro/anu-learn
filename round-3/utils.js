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