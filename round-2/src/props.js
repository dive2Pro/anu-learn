
export function assignDefaultProps(defaultProps, nextProps) {
  for (const name in defaultProps) {
    if (defaultProps.hasOwnProperty(name) && !nextProps[name]) {
      nextProps[name] = defaultProps[name]
    }
  }
}