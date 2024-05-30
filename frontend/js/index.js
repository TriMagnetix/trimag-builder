import { $ } from './modules/common.js'
import { svg, path, svg2bitmap } from './modules/svg-lib.js'
import { triangle, invertedTriangle, arrangement } from './modules/gates.js'
import { mesh } from './modules/mesh-lib.js'

const download = () => {
	const svg = $('main').innerHTML
	const a = document.createElement('a')

	a.setAttribute('href', `data:image/svg;charset=utf-8,${encodeURIComponent(svg)}`)
	a.setAttribute('download', 'gate-array.svg')
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
}

const triangles =
	svg()
	.shapes([
		arrangement({
			positionGrid: [
				[0, 1, 0, 1, 0, 1],
				[0, 1, 0, 1, 0, 1],
				[1, 0, 1, 0, 1, 0],
				[1, 0, 1, 0, 1, 0],
			],
			spacing: 10,
			triangleSpecs: {
				width: 200,
				vertexRad: 10,
				sideRad: 50,
				extrusion: 70,
			},
		}),
	])
	.renderTo($('main'))
	.fitContent()

mesh()
.fromBitmap(await svg2bitmap(triangles))
//download()
