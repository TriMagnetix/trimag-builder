import { $ } from './modules/common.js'
import { svg, path, svg2bitmap } from './modules/svg-lib.js'
import { triangle, invertedTriangle, arrangement } from './modules/gates.js'
import { mesh, mesh2nmesh, mesh2neutralmesh } from './modules/mesh-lib.js'

const download = async (content, filename, type = 'data:text/plain;charset=utf-8') => {
	const blob = new Blob([content], {type})
	const a = document.createElement('a')

	a.setAttribute('href', URL.createObjectURL(blob))
	a.setAttribute('download', filename)
	a.textContent = 'here';
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
}

const triangles =
	svg()
	.shapes([
		arrangement({
			positionGrid: [
				[1],
			],
			/*
			positionGrid: [
				[0, 1, 0, 1, 0, 1],
				[0, 1, 0, 1, 0, 1],
				[1, 0, 1, 0, 1, 0],
				[1, 0, 1, 0, 1, 0],
			],
			*/
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

const trianglesBitmap = await svg2bitmap(triangles)

const trianglesMesh =
	mesh()
	.fromBitmap(trianglesBitmap)
	//.smooth()
	.extrude(2)

//const trianglesNmesh = mesh2nmesh(trianglesMesh)

//download(trianglesNmesh, 'triangles.nmesh')

const trianglesNeutralmesh = mesh2neutralmesh(trianglesMesh)

download(trianglesNeutralmesh, 'triangles.mesh')
