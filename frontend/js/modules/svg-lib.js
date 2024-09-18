export const svg = () => {
	const elem = document.createElement('svg')
	let _rendered

	elem.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
	
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
		targetElem.innerHTML = elem.outerHTML

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

	elem.l = (x, y) => {
		const prev = elem.getAttribute('d') || ''
		elem.setAttribute('d', `${prev} l ${x} ${y}`)
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

export const svg2bitmap = svg => {
	const image = new Image()

	const bitmap = new Promise(resolve => {
		image.onload = () => resolve(createImageBitmap(image))
		image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`
	})

	return bitmap
}

export const svg2points = async svg => {
	const bitmap = await svg2bitmap(svg)
	const canvas = document.createElement('canvas')

	canvas.width = bitmap.width
	canvas.height = bitmap.height

	const ctx = canvas.getContext('2d')

	ctx.drawImage(bitmap, 0, 0)

	const points = new Set()
	const bytes = []

	ctx.getImageData(0, 0, canvas.width, canvas.height).data
		.forEach((byte, i) => {
			const y = Math.floor(i / (canvas.width * 4))
			const x = Math.floor(i % (canvas.width * 4) / 4)
			bytes.push(byte)

			if (i % 4 != 3) return
			if (byte == 0) return

			points.add(JSON.stringify({x, y, z: 0, exterior: true}))
		})
	
	console.log(bytes)
	
	return [...points].map(p => JSON.parse(p))
}
