import { $ } from './modules/common.js'
import Scene from './modules/scene.js'
import { svg, path, svg2points } from './modules/svg-lib.js'
import { triangle, invertedTriangle, arrangement } from './modules/gates.js'
import {
	extrudePoints,
	createTetrahedrons,
	drawModel,
	centerScene,
	arrangeModel,
} from './modules/model-utils.js'

const scene = new Scene()
	.project(2, $('canvas').width / $('canvas').height)

const positionGrid = [
	[true, false, true],
	[false, true, false],
	[false, true, false]
]

/**
 * @typedef {Object} Point
 * @property {boolean} exterior - If this point is visible when rendering.
 * @property {number} x - The x coordinate of the point.
 * @property {number} y - The y coordinate of the point.
 * @property {number} z - The z coordinate of the point.
 */

/** 
 * @type {Array<Array<Point>>} 
 * An array of tetrahedrons, where each tetrahedron is an 
 * array of 4 point objects. Each point is an object with 
 * `x`, `y`, and `z` properties representing the 3D coordinates.
*/
let tetrahedrons = []

const renderMesh = async () => {
	const componentModel = await (await fetch('res/triangle.json')).json()
	tetrahedrons = arrangeModel(positionGrid.toReversed(), componentModel)
	centerScene(scene, tetrahedrons)
	drawModel(scene, tetrahedrons)
}

// Triangle grid controls

const toggleControls = ({ target }) => {
	if (target.classList.contains('selected')) {
		target.classList.remove('selected')
		$('#show-controls-target').classList.add('hidden')
	} else {
		target.classList.add('selected')
		$('#show-controls-target').classList.remove('hidden')
	}
}

/**
 * Onclick function for toggling triangle visibility. 
 * This function triggers whenever someone clicks on an item within the grid. 
 * The cell contains the whole svg element and the target will contain the "top" most SVG element.
 *
 * @param {HTMLDivElement} cell - The div element representing a single cell within a grid structure.
 * @param {{x: number, y: number}} coordinates - The coordinates of the cell in the grid.
 * @returns {function({target: Element}): void} Event handler function.
 */
const toggleTriangle = (cell, coordinates) => ({ target }) => {
	const MAG_BLUE = '#8792e5'
	const MAG_RED = '#f07777'
	const trianglePathSvgElement = cell.querySelector("#magnetized-triangle-svg #triangle")
	/* If we get a click on a vertex and the triangle is visible we 
	want to cycle through magnetizations (positive, negative, neutral) */
	if (target.classList.contains('magnetization-vertex') && trianglePathSvgElement.classList.contains('visible')) {
		if (target.classList.contains('visible') && target.getAttribute('fill') === MAG_BLUE) {
			target.setAttribute('fill', MAG_RED)
		} else if (target.classList.contains('visible') && target.getAttribute('fill') === MAG_RED) {
			target.classList.remove('visible')
			target.classList.add('hidden')
		} else if (target.classList.contains('hidden')) {
			target.setAttribute('fill', MAG_BLUE)
			target.classList.remove('hidden')
			target.classList.add('visible')
		} else {
			throw new Error(`Magnetization vertex contains invalid fill and/or class list: ${target}`)
		}
	} else {
		if (trianglePathSvgElement?.classList.contains('visible')) {
			positionGrid[coordinates.x][coordinates.y] = false
			// If it is visible we are toggling to hide it, also hide the magnetization vertices
			trianglePathSvgElement.classList.remove('visible')
			trianglePathSvgElement.classList.add('hidden')
			cell.querySelectorAll('#magnetized-triangle-svg .magnetization-vertex').forEach((magVertex) => {
				magVertex.classList.remove('visible')
				magVertex.classList.add('hidden')
			})
		} else if (trianglePathSvgElement?.classList.contains('hidden')) {
			positionGrid[coordinates.x][coordinates.y] = true
			trianglePathSvgElement.classList.remove('hidden')
			trianglePathSvgElement.classList.add('visible')
		} else {
			throw new Error(`Triangle path element could not be found or has invalid class list: ${trianglePathSvgElement}`)
		}
	} 

	renderMesh()
}

/**
 * Loads an SVG image into a specified grid cell, potentially varying the SVG
 * based on whether the cell is in an even or odd row.
 *
 * @param {HTMLDivElement} cell - The div element representing a single cell within a grid structure.
 * @param {{x: number, y: number}} coordinates - The coordinates of the cell in the grid.
 */
const loadSvgForCell = async (cell, coordinates) => {
	const svgUrl = `/img/magnetized-triangle${coordinates.x % 2 === 0 ? "" : "-flipped"}.svg`
	const svgTextBody = await (await fetch(svgUrl)).text()
	cell.innerHTML = svgTextBody
	const trianglePathSvgElement = cell.querySelector("#magnetized-triangle-svg #triangle")
	if (!positionGrid[coordinates.x][coordinates.y]) {
		trianglePathSvgElement.classList.remove("visible")
		trianglePathSvgElement.classList.add("hidden")
		cell.querySelectorAll('#magnetized-triangle-svg .magnetization-vertex').forEach((magVertex) => {
			magVertex.classList.remove('visible')
			magVertex.classList.add('hidden')
		})
	}
	cell.onclick = toggleTriangle(cell, coordinates)
}

const makeTriangleGrid = () => {
	const rows = positionGrid.length
	const cols = positionGrid[0].length

	$('#triangle-grid').innerHTML = '';
	$('#triangle-grid').style['grid-template-columns'] =
		Array(cols).fill(0).map(_ => 'auto').join(' ')
	
	// Rows are read backwards to match the drawing coordinate system
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			const cell = document.createElement('div')
			const coordinates = { x: i, y: j }
			loadSvgForCell(cell, coordinates)
			
			$('#triangle-grid').appendChild(cell)
		}
	}

	renderMesh()
}

const changeNumRows = ({ target }) => {
	if (target.value < 1) target.value = 1

	const rows = target.value
	const cols = $('#cols-input').value

	while (positionGrid.length > rows)
		positionGrid.splice(-1)

	while (positionGrid.length < rows)
		positionGrid.push(Array(cols).fill(0))

	makeTriangleGrid()
}

const changeNumCols = ({ target }) => {
	if (target.value < 1) target.value = 1

	const rows = $('#rows-input').value
	const cols = target.value

	while (positionGrid[0].length > cols)
		positionGrid.forEach(row => row.splice(-1))

	while (positionGrid[0].length < cols)
		positionGrid.forEach(row => row.push(0))

	makeTriangleGrid()
}

/**
 * Generates nmesh file blob based on tetrahedrons
 * I haven't stress tested it, but it should fail when we have around a couple 
 * million tetrahedrons. More efficient approaches will have to be considered then.
 * https://nmag.readthedocs.io/en/latest/finite_element_mesh_generation.html#nmesh-file-format
 * @returns {Blob}
 */
const generateNmeshFileBlob = () => {
	// Delimiter to use for point -> key generation & surface generation
	const DELIM = ','

	/**
	 * @param {Point} point
	 */
	const generateKeyFromPoint = ({x, y, z}) => [x, y, z].join(DELIM)

	/** @type {Array<Point>} 
	 * An array to store unique nodes (points).
	 */
	const nodes = []

	/** 
	 * @type {Map<string, number>} 
	 * A map to track unique nodes by their stringified coordinates, mapping to a node index. 
	 */
	const nodeMap = new Map()

	/** @type {number} 
	 * The index to assign to the next unique node. 
	 */
	let nodeIndex = 0

	/** @type {Array<Array<number>>} 
	 * An array to store tetrahedrons as arrays of node indices.
	 * The inner array is always of length 4 and contains the node index for each point.
	 */
	const simplices = []

	/** @type {Set<string>} 
	 * Set to keep track of each unique surface
	 */
	const uniqueSurfaces = new Set()

	// Generate nodes and unique indexes for the node map
	tetrahedrons.forEach((tetrahedron) => {
		tetrahedron.forEach((point) => {
			const key = generateKeyFromPoint(point)
			if (!nodeMap.has(key)) {
				nodeMap.set(key, nodeIndex)
				nodes.push(point)
				nodeIndex++
			}
		})
	})

	// Generate simplices
	tetrahedrons.forEach((tetrahedron) => {
		const tetrahedronAsNodeIndexes = tetrahedron.map((point) => nodeMap.get(generateKeyFromPoint(point)))
		simplices.push(tetrahedronAsNodeIndexes)
	})

	// Generate surfaces 
	for (const simplex of simplices) {
		/* Each tetrahedron has 4 surfaces so iterate through 
		4 times to get each surface (3 point combination) */
		for (let i = 0; i < 4; i++) {
			const surface = [
				simplex[(i + 1) % 4],
				simplex[(i + 2) % 4],
				simplex[(i + 3) % 4],
			].sort((a, b) => a - b)
			// Use a strigified version of the face as the key to the set
			uniqueSurfaces.add(surface.join(DELIM))
		}
	}

	/** @type {Array<Array<number>>} 
	 * An array to store all unique tetrahedron surfaces.
	 * The inner array is always of length 3 and contains the node index for each point.
	 */
	const surfaces = Array.from(uniqueSurfaces).map((face) =>
		face.split(DELIM).map(Number)
	)

	/** @type {string} The content of the `.nmesh` file as a string. */
	let nmeshFileContent = '# PYFEM mesh file version 1.0\n'

	nmeshFileContent += `# dim = 3 nodes = ${nodes.length}` + 
	` simplices = ${simplices.length} surfaces = ${surfaces.length} periodic = 0\n`

	nmeshFileContent += `${nodes.length}\n`
	nodes.forEach((node, i) => {
		nmeshFileContent += ` ${node.x} ${node.y} ${node.z}\n`
	})

	nmeshFileContent += `${simplices.length}\n`
	simplices.forEach((simplex) => {
		nmeshFileContent += ` 1 ${simplex.join(' ')}\n`
	})

	nmeshFileContent += `${surfaces.length}\n`
	surfaces.forEach((surface) => {
		// Use -1 and 1 as the default regions for all our surfaces
		nmeshFileContent += ` -1 1 ${surface.join(' ')}\n`
	})

	// Finish file by adding a 0 at the end
	nmeshFileContent += '0\n'

	return new Blob([nmeshFileContent], { type: 'text/plain' })
}

/**
 * Onclick function for running the simulation
 * @param {Event} e
 */
const runSimulation = async (e) => {
	$('#run-simulation').innerHTML = 'Running...' 
	// 1 day
	const SIMULATION_TIMEOUT_IN_MS = 1 * 24 * 60 * 60 * 1000;

	const body = new FormData()
	body.append('file', generateNmeshFileBlob(), 'generated.nmesh')

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), SIMULATION_TIMEOUT_IN_MS);
		const response = await fetch('http://localhost:1235/nsim', {
			signal: controller.signal,
			method: 'POST',
			body,
		})
		clearTimeout(timeoutId)
		const responseBlob = await response.blob()
		const downloadUrl = window.URL.createObjectURL(responseBlob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = 'nsim_dat.ndt';
		document.body.appendChild(a);
		a.click();
		a.remove();
		window.URL.revokeObjectURL(downloadUrl);
	} catch (e) {
		window.alert(`Error running simulation ${e}`)
	}

	$('#run-simulation').innerHTML = 'Run Simulation'
}

/**
 * Onclick function for downloading nmesh file from tetrahedrons
 * @param {Event} e
 */
const downloadNmeshFile = (e) => {
	$('#download-nmesh-file').innerHTML = 'Generating...'
	
	const a = document.createElement('a')
	a.href = URL.createObjectURL(generateNmeshFileBlob())
	a.download = 'generated.nmesh'
	a.style.display = 'none'
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)

	$('#download-nmesh-file').innerHTML = 'Download Nmesh File'
}

$('#show-controls-button').onclick = toggleControls
$('#rows-input').onclick = changeNumRows
$('#rows-input').onblur = changeNumRows
$('#rows-input').onkeypress = (e) => e.key == 'Enter' ? changeNumRows(e) : e
$('#cols-input').onclick = changeNumCols
$('#cols-input').onblur = changeNumCols
$('#cols-input').onkeypress = (e) => e.key == 'Enter' ? changeNumCols(e) : e
$('#download-nmesh-file').onclick = downloadNmeshFile
$('#run-simulation').onclick = runSimulation

// Initial state

$('#rows-input').value = 3
$('#cols-input').value = 3

makeTriangleGrid([
	[0, 1, 0],
	[0, 1, 0],
	[1, 0, 1],
])

// Limit rendering calls to improve efficiency

const timeBetweenDraws = 30
let lastDrawTime = 0

const canDraw = () => {
	if (Date.now() - lastDrawTime < timeBetweenDraws) {
		return false
	}

	lastDrawTime = Date.now()

	return true
}

// Tranformation controls

$('main').onmousedown = () => $('main').isClicked = true
$('main').onmouseup = () => $('main').isClicked = false
$('main').onmouseout = () => $('main').isClicked = false

$('main').onmousemove = e => {
	if (!$('main').isClicked) return
	if (!canDraw()) return

	scene.clear()

	// Click and drag to rotate
	!e.shiftKey && scene.rotate(
		Math.PI * e.movementY / 100,
		Math.PI * e.movementX / 100,
		0,
	)

	// Shift-Click and drag to translate
	e.shiftKey && scene.translate(
		4.5 * e.movementX / $('main').clientWidth,
		-4.5 * e.movementY / $('main').clientHeight,
		0,
	)

	drawModel(scene, tetrahedrons)
}

// Mouse-wheel to scale
$('main').onwheel = e => {
	if (!canDraw()) return

	scene.clear()
	scene.scale(e.deltaY > 0 ? 1.15 : 0.85)
	drawModel(scene, tetrahedrons)
}

// Resize canvas when it's containers size changes
setInterval(() => {
	if (
		$('canvas').width == $('main').clientWidth
		&& $('canvas').height == $('main').clientHeight
	) return

	scene
		.resizeCanvas($('main').clientWidth, $('main').clientHeight)
		.project(2, $('canvas').width / $('canvas').height)
	drawModel(scene, tetrahedrons)
}, 100)
