export const svg = () => {
	const elem = document.createElement('svg')
	let _rendered
	
	elem.width = n => {
		elem.setAttribute('width', n)
		return elem
	}

	elem.height = n => {
		elem.setAttribute('height', n)
		return elem
	}

	elem.shapes = s => {
		elem.append(...s)
		return elem
	}

	elem.renderTo = targetElem => {
		const temp = document.createElement('div')

		temp.append(elem)
		targetElem.innerHTML = temp.innerHTML

		_rendered = targetElem.children[0]

		return elem
	}

	elem.fitContent = () => {
		if (!_rendered) throw 'Must invoke `renderTo` before `fitContent`'

		const { width, height } = _rendered.getBBox()

		elem.width(width)
		elem.height(height)
		_rendered.setAttribute('width', width)
		_rendered.setAttribute('height', height)

		return elem
	}

	return elem
}

export const group = () => {
	const elem = document.createElement('g')

	elem.shapes = s => {
		elem.append(...s)
		return elem
	}

	return elem
}

export const path = () => {
	const elem = document.createElement('path')

	elem.M = (x, y) => {
		const prev = elem.getAttribute('d') || ''
		elem.setAttribute('d', `${prev} M ${x} ${y}`)
		return elem
	}

	elem.m = (x, y) => {
		const prev = elem.getAttribute('d') || ''
		elem.setAttribute('d', `${prev} m ${x} ${y}`)
		return elem
	}

	elem.a = (rx, ry, x, y, sweep=1, xRot=0, large=0) => {
		const prev = elem.getAttribute('d') || ''
		elem.setAttribute('d', `${prev} a ${rx} ${ry} ${xRot} ${large} ${sweep} ${x} ${y}`)
		return elem
	}

	elem.fill = f => {
		elem.setAttribute('fill', f)
		return elem
	}

	return elem
}

export const circle = () => {
	const elem = document.createElement('circle')

	elem.cx = n => {
		elem.setAttribute('cx', n)
		return elem
	}

	elem.cy = n => {
		elem.setAttribute('cy', n)
		return elem
	}

	elem.r = n => {
		elem.setAttribute('r', n)
		return elem
	}

	elem.fill = f => {
		elem.setAttribute('fill', f)
		return elem
	}

	return elem
}
