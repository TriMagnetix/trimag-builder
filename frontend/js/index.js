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

const renderMesh = async (positionGrid) => {
	const componentModel = await (await fetch('res/triangle.json')).json()
	tetrahedrons = arrangeModel(positionGrid, componentModel)
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

const getPositionGrid = () => {
	let isEvenRow = false
	const positionGrid = [[]]

	Array.from($('#triangle-grid').children).forEach(c => {
		if (isEvenRow != c.classList.contains('even-row')) {
			positionGrid.unshift([])
			isEvenRow = c.classList.contains('even-row')
		}

		positionGrid[0]
			.push(c.classList.contains('selected'))
	})

	return positionGrid
}

const toggleTriangle = ({ target }) => {
	target.classList.contains('selected')
		? target.classList.remove('selected')
		: target.classList.add('selected')
	
	renderMesh(getPositionGrid())
}

const makeTriangleGrid = (positionGrid) => {
	const rows = positionGrid.length
	const cols = positionGrid[0].length

	$('#triangle-grid').innerHTML = '';
	$('#triangle-grid').style['grid-template-columns'] =
		Array(cols).fill(0).map(_ => 'auto').join(' ')
	
	// Rows are read backwards to match the drawing coordinate system
	for (let i = rows - 1; i >= 0; i--) {
		for (let j = 0; j < cols; j++) {
			const cell = document.createElement('div')
			
			cell.classList.add(...[
				'triangle',
				(i + 1) % 2 == 0 && 'even-row',
				positionGrid[i][j] && 'selected',
			].filter(c => c))

			cell.onclick = toggleTriangle
			
			$('#triangle-grid').appendChild(cell)
		}
	}

	renderMesh(positionGrid)
}

const changeNumRows = ({ target }) => {
	if (target.value < 1) target.value = 1

	const rows = target.value
	const cols = $('#cols-input').value
	const positionGrid = getPositionGrid()

	while (positionGrid.length > rows)
		positionGrid.splice(-1)

	while (positionGrid.length < rows)
		positionGrid.push(Array(cols).fill(0))

	makeTriangleGrid(positionGrid)
}

const changeNumCols = ({ target }) => {
	if (target.value < 1) target.value = 1

	const rows = $('#rows-input').value
	const cols = target.value
	const positionGrid = getPositionGrid()

	while (positionGrid[0].length > cols)
		positionGrid.forEach(row => row.splice(-1))

	while (positionGrid[0].length < cols)
		positionGrid.forEach(row => row.push(0))

	makeTriangleGrid(positionGrid)
}

/**
 * Onclick function for converting tetrahedrons to Nmesh file.
 * I haven't stress tested it, but it should fail when we have around a couple 
 * million tetrahedrons. More efficient approaches will have to be considered then.
 * https://nmag.readthedocs.io/en/latest/finite_element_mesh_generation.html#nmesh-file-format
 * @param {Event} e
 */
const downloadNmeshFile = (e) => {
	$('#download-nmesh-file').innerHTML = 'Generating...'
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

	const nmeshFileBlob = new Blob([nmeshFileContent], { type: 'text/plain' })

	const a = document.createElement('a')
	a.href = URL.createObjectURL(nmeshFileBlob)
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
