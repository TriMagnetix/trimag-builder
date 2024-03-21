import { $ } from './modules/common.js'
import { svg } from './modules/svg-lib.js'
import { invertedTriangle } from './modules/gates.js'

svg()
.shapes([
	invertedTriangle({
		base: 200,
		vertexRad: 10,
		sideRad: 50,
		extrusion: 70,
	})
])
.renderTo($('main'))
.fitContent()
