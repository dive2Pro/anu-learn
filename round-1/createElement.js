
function createFragmentShape(children) {
	return {
		Type: 1,
		type: 'fragment',
		props: fragProps,
		children: children,
		DOMNode: null,
		instance: null,
		index: 0,
		nodeName: null,
		key: void 0
	};
}

function createComponentShape(type, props, children) {
	return {
		Type: 2,
		type: type,
		props: (props = props != null ? props : objEmpty),
		children: (children == null ? arrEmpty : children),
		DOMNode: null,
		instance: null,
		index: 0,
		nodeName: null,
		key: props !== objEmpty ? props.key : void 0
	};
}

function createElementShape(type, props, children) {
	return {
		Type: 1,
		type: type,
		props: (props = props != null ? props : objEmpty),
		children: (children == null ? [] : children),
		DOMNode: null,
		instance: null,
		index: 0,
		nodeName: null,
		key: props !== objEmpty ? props.key : void 0
	};
}

function createTextShape(text) {
	return {
		Type: 3,
		type: '#text',
		props: objEmpty,
		children: text,
		DOMNode: null,
		instance: null,
		index: 0,
		nodeName: null,
		key: void 0
	};
}

function createPortalShape(type, props, children = []) {
	return {
		Type: 4,
		type: type.nodeName.toLocaleLowerCase(),
		props : (props = props != null ? props : objEmpty),
		children,
		DOMType: type,
		instance: null,
		index: 0,
		nodeName: null,
		key: props !== objEmpty ? props.key : void 0
	}
}

function createEmptyShape() {
	return {
		Type: 1,
		type: 'noscript',
		props: objEmpty,
		children: [],
		DOMNode: null,
		instance: null,
		index: 0,
		nodeName: null,
		key: void 0
	}
}


function createChild(child, children, index) {
	if (child != null) {
		// 表示 child 为 vnode
		if (child.Type !== void 0) {
			children[index++] = child
		}
		// portal
		else if (child.nodeType !== void 0) {
			children[index++] = createPortalShape(child, objEmpty, arrEmpty)
		} else {
			let type = typeof child

			if (type === 'function') {
				children[index++] = createComponentShape(child, objEmpty, arrEmpty)
			}
			// array React16
			// TODO: Array.is ?
			else if (type === 'object') {
				for (let i = 0, length = child.length; i < length; i ++) {
					index = createChild(child[i], children, index)
				}
			}
			// text * React 16
			else {
				children[index++] = createTextShape(type !== 'boolean' ? child : '')
			}
		}
	}
	return index;
}
export function createElement(type, props) {
	if (type == null) {
		/**
		 * 空组件, 但是不能简单的返回 null,
		 * 这里好像和 Rect 有不同 TODO: 不同在哪里
		 */
		return createEmptyShape();
	}
	let length = arguments.length;
	let children = []

	let index = 0

	for (let i = 2; i < length; i ++) {
		/**
		 * 这里使用这种方式来处理的用意在哪?
		 * 1. createElement(type, props, child, child , child ) ?
		 * * 答:
		 * 			对, jsx 会转化为这种形式
		 *
		 */
		let child = arguments[i]

		if (child != null) {

			/**
			 *	处理 array 的情况
			 *	因为 在 jsx 中 数组一般都是由Element 构成, 所以这里同样要进行 转化
			 *  同时 flatten 一层
			 */
			 for (let j = 0, len = child.length; j < len ; j ++) {
			 		index = createChild(child[j], children, index);
			 }
		}

	}

	let typeOf = typeof type

	if (typeOf === 'string') {
		if (props === null) {
			props = {}
		}
		/**
		 * React16: Fragment
		 */
		if (type === '@') {
			return createFragmentShape(children)
		}

		// svg and math namespace
		if (type === 'svg') {
			props.xmlns = nsSvg
		} else if (type === 'math') {
			props.xmlns = nsMath
		}
		return createElementShape(type, props, children)
	} else if (typeOf === 'function') {
		return createComponentShape(type, props, children)
	} else if (type.Type != null) {
		// 如果已经是一个 element
		return cloneElement(type, props, children);
	}
}

/**
 * have the original element’s props with the new props merged in shallowly.
 * New children will replace existing children.
 * @param type
 * @param props
 * @param children
 */
function cloneElement(subject, newProps, newChildren) {
	let type = subject.type
	let props = subject.props
	let children = newChildren || subject.children

	newProps = newProps || {}

	for (let name in props) {
		if (newProps[name] === void 0) {
			newProps[name] = props[name]
		}
	}

	if (newChildren !== void 0) {
		const length = newChildren.length

		if (length) {
			let index = 0
			children = []

			for (let i = 0; i < length ; i ++) {
				 index = createChild(newChildren[i], children, index)
			}
		}
	}
	return createElement(type, newProps, children)
}