import { $ } from './modules/common.js'
import { svg, path } from './modules/svg-lib.js'
import { triangle, invertedTriangle } from './modules/gates.js'

svg()
.shapes([
	invertedTriangle({
		position: { x: 0, y: 0 }, 
		base: 200,
		vertexRad: 10,
		sideRad: 50,
		extrusion: 70,
	}),
	triangle({
		position: { x: 0, y: 0.5 * 200 * Math.sqrt(3) + 10 }, 
		base: 200,
		vertexRad: 10,
		sideRad: 50,
		extrusion: 70,
	}),
])
.renderTo($('main'))
.fitContent()
