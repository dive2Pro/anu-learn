import {createComponentShape, createElement, createEmptyShape} from "./createElement";

function extractVirtualNode(subject, component ) {
	if (subject == null) {
		return createEmptyShape()
	}

	if(subject.Type !== void 0) {
		return subject
	}

	if (subject.nodeType !== void 0) {
		return (
			subject = createPortalShape(subject, objEmpty, arrEmpty),
			subject.Type = 5,
			subject
		)
	}

	switch (subject.constructor) {
		case Component :
			return createComponentShape(subject, objEmpty, arrEmpty)
		case Boolean:
			return createEmptyShape()
		case Array:
			return createElement('@', null, subject)
		case String:
		case Number:
			return createTextShape(subject)
		case Function:
			// TODO: 什么是stream ?
			if(subject.then != null && typeof subject.then === 'function') {
				if(subject['--listening'] !== true) {
					subject.then(function resolveStreamComponent() {
						component.forceUpdate()
					}).catch(funcEmpty)
					subject['--listening'] = true
				}
				// TODO: why ?
				return extractVirtualNode(subject(), component)
			}
			// component
			else if(subject.prototype !== void 0 && subject.prototype.render !== void 0) {
				return createComponentShape(subject, objEmpty, arrEmpty)
			}
			// function
			else {
				return extractVirtualNode(subject(component != null ? component.props : {} ), component)
			}
	}

	if (typeof subject.render === 'function') {
		return (subject.COMPCache || createComponentShape(subject.COMPCache = createClass(subject, null), objEmpty, arrEmpty))
	}
	// unsupported render types , fail gracefully
	else {
		return componentRenderBoundary(
			component,
			'render',
			subject.constructor.name,
			''
		)
	}
}