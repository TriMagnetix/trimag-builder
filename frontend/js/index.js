import { $ } from './modules/common.js'
import Scene from './modules/scene.js'
import {
	drawModel,
	centerScene,
	arrangeModel,
} from './modules/model-utils.js'
import { Magnetization } from './types.js'

/**
 * Top level import from types .d.ts file so we 
 * don't need to import every type individually
 * @typedef {import('./types').Types} Types
 */

const scene = new Scene()
	.project(2, $('canvas').width / $('canvas').height)

const positionGrid = [
	[false, false, false],
	[false, true, false],
	[false, false, false]
]

/**
 * 2D grid representing the magnetization states of the triangles.
 *
 * @type {Array<Array<Types['TriangleMagnetization']>>}
 */
const magnetizationGrid = Array.from({ length: positionGrid.length }, () =>
  Array.from({ length: positionGrid[0].length }, () => ({a: Magnetization.NONE, b: Magnetization.NONE, c: Magnetization.NONE}))
);


/** 
 * @type {Array<Array<Types['Point']>>} 
 * An array of tetrahedrons, where each tetrahedron is an 
 * array of 4 point objects. Each point is an object with 
 * `x`, `y`, and `z` properties representing the 3D coordinates.
*/
let tetrahedrons = []


/**
 * @type {Array<Types['MagnetizationField']>}
 */
let magnetizationFields = [];

const renderMesh = async () => {
	const padding = { x: 0, y: 0.00001 };
	const componentModel = await (await fetch('res/triangle.json')).json()
	const result = arrangeModel(positionGrid.toReversed(), magnetizationGrid.toReversed(), componentModel, padding)
	tetrahedrons = result.tetrahedrons
	magnetizationFields = result.magnetizationFields
	centerScene(scene, tetrahedrons, magnetizationFields)
	drawModel(scene, tetrahedrons, magnetizationFields)
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
 * @returns {function(MouseEvent): void} Event handler function.
 */
const toggleTriangle = (cell, coordinates) => ({target}) => {
	if (!(target instanceof Element)) {
		return;
	}
	const MAG_BLUE = '#8792e5'
	const MAG_RED = '#f07777'
	const triangleSvgClassList = cell.querySelector("#magnetized-triangle-svg #triangle").classList
	const targetClassList = target.classList
	const { x, y } = coordinates
	// This will be a, b, or c depending on the vertex clicked
	const vertex = [target.id.slice(-1)].toString()
	const triangleMagnetization = magnetizationGrid[x][y]
	/* If we get a click on a vertex and the triangle is visible we 
	want to cycle through magnetizations (positive, negative, neutral) */
	if (targetClassList.contains('magnetization-vertex') && triangleSvgClassList.contains('visible')) {
		if (targetClassList.contains('visible') && target.getAttribute('fill') === MAG_BLUE) {
			target.setAttribute('fill', MAG_RED)
			triangleMagnetization[vertex] = Magnetization.POSITIVE
		} else if (targetClassList.contains('visible') && target.getAttribute('fill') === MAG_RED) {
			triangleMagnetization[vertex] = Magnetization.NONE
			targetClassList.remove('visible')
			targetClassList.add('hidden')
		} else if (targetClassList.contains('hidden')) {
			target.setAttribute('fill', MAG_BLUE)
			triangleMagnetization[vertex] = Magnetization.NEGATIVE
			targetClassList.remove('hidden')
			targetClassList.add('visible')
		} else {
			throw new Error(`Magnetization vertex contains invalid fill and/or class list: ${target}`)
		}
	} else {
		if (triangleSvgClassList.contains('visible')) {
			positionGrid[x][y] = false
			// If it is visible we are toggling to hide it, also hide the magnetization vertices
			triangleSvgClassList.remove('visible')
			triangleSvgClassList.add('hidden')
			cell.querySelectorAll('#magnetized-triangle-svg .magnetization-vertex').forEach((magVertex) => {
				magVertex.classList.remove('visible')
				magVertex.classList.add('hidden')
			})
			triangleMagnetization.a = Magnetization.NONE
			triangleMagnetization.b = Magnetization.NONE
			triangleMagnetization.c = Magnetization.NONE
		} else if (triangleSvgClassList.contains('hidden')) {
			positionGrid[x][y] = true
			triangleSvgClassList.remove('hidden')
			triangleSvgClassList.add('visible')
		} else {
			throw new Error(`Triangle path element could not be found or has invalid class list: ${triangleSvgClassList}`)
		}
	} 

	renderMesh()
}

/**
 * @type {Object.<string, string>}
 * @description A cache to store SVG content, mapped by their URLs.
 */
const svgCache = {}

/**
 * Fetches an SVG from the given URL and caches it.
 * If the SVG is already in the cache, return the cached version.
 * This is needed because even if fetching it from local machine there is still overhead 
 * from fetching it row*column amount of times, so this speeds up rendering of the grid.
 *
 * @param {string} svgUrl - The URL of the SVG file to fetch.
 * @returns {Promise<string>} A promise that resolves with the SVG content as a string.
 */
const getSvg = async (svgUrl) => {
	if (svgUrl in svgCache) {
		return svgCache[svgUrl]
	} else {
		const svgText = await (await fetch(svgUrl)).text()
		svgCache[svgUrl] = svgText
		return svgText
	}
}

/**
 * Loads a triangle SVG image into a specified grid cell, potentially varying 
 * the triangle SVG based on whether the cell is in an even or odd row.
 *
 * @param {HTMLDivElement} cell - The div element representing a single cell within the grid.
 * @param {{x: number, y: number}} coordinates - The coordinates of the cell in the grid.
 */
const loadSvgForCell = async (cell, coordinates) => {
	const { x, y } = coordinates
	const isInEvenRow = x % 2 === 0;
	const svgUrl = `img/magnetized-triangle${isInEvenRow ? "" : "-flipped"}.svg`
	const svgTextBody = await getSvg(svgUrl)
	cell.innerHTML = svgTextBody
	const trianglePathSvgElement = cell.querySelector("#magnetized-triangle-svg #triangle")
	// De-magnitize everything to start with
	cell.querySelectorAll('#magnetized-triangle-svg .magnetization-vertex').forEach((magVertex) => {
		magVertex.classList.remove('visible')
		magVertex.classList.add('hidden')
	})
	// Hide the triangle if its not currently in the grid
	if (!positionGrid[x][y]) {
		trianglePathSvgElement.classList.remove("visible")
		trianglePathSvgElement.classList.add("hidden")
	}
	cell.onclick = toggleTriangle(cell, coordinates)
}

const makeTriangleGrid = async () => {
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
			await loadSvgForCell(cell, coordinates)
			
			$('#triangle-grid').appendChild(cell)
		}
	}

	renderMesh()
}

const changeNumRows = ({ target }) => {
	if (target.value < 1) target.value = 1

	const rows = Number.parseInt(target.value)
	const cols = Number.parseInt($('#cols-input').value)

	while (positionGrid.length > rows) {
		positionGrid.splice(-1)
		magnetizationGrid.splice(-1)
	}

	while (positionGrid.length < rows) {
		positionGrid.push(Array(cols).fill(0))
		magnetizationGrid.push(Array(cols).fill({a: Magnetization.NONE, b: Magnetization.NONE, c: Magnetization.NONE}))
	}

	makeTriangleGrid()
}

const changeNumCols = ({ target }) => {
	if (target.value < 1) target.value = 1

	const cols = Number.parseInt(target.value)

	while (positionGrid[0].length > cols) {
		positionGrid.forEach(row => row.splice(-1))
		magnetizationGrid.forEach(row => row.splice(-1))
	}

	while (positionGrid[0].length < cols) {
		positionGrid.forEach(row => row.push(false))
		magnetizationGrid.forEach(row => row.push({a: Magnetization.NONE, b: Magnetization.NONE, c: Magnetization.NONE}))
	}

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
	 * @param {Types['Point']} point
	 */
	const generateKeyFromPoint = ({x, y, z}) => [x, y, z].join(DELIM)

	/** @type {Array<Types['Point']>} 
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
	body.append('magnetizationFields', JSON.stringify(magnetizationFields))

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
$('#rows-input').addEventListener('change', changeNumRows)
$('#cols-input').addEventListener('change', changeNumCols)
$('#download-nmesh-file').onclick = downloadNmeshFile
$('#run-simulation').onclick = runSimulation

// Initial state

$('#rows-input').value = 3
$('#cols-input').value = 3

makeTriangleGrid()

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

	drawModel(scene, tetrahedrons, magnetizationFields)
}

// Mouse-wheel to scale
$('main').onwheel = e => {
	if (!canDraw()) return

	scene.clear()
	scene.scale(e.deltaY > 0 ? 1.15 : 0.85)
	drawModel(scene, tetrahedrons, magnetizationFields)
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
	drawModel(scene, tetrahedrons, magnetizationFields)
}, 100)
