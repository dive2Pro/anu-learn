/**
 * 
 * @param {Vnode} subject 
 */
export default function isValidElement(subject) {
  return subject && subject.Type != null
}