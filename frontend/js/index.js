import { $ } from './modules/common.js'
import { svg, path } from './modules/svg-lib.js'
import { triangle, invertedTriangle, arrangement } from './modules/gates.js'

svg()
.width(1000)
.height(1000)
.shapes([
	arrangement({
		positionGrid: [[0, 1, 0],[0, 1, 0], [1, 0, 1]],
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
//.fitContent()
