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

let tetrahedrons = []

const renderMesh = async (positionGrid) => {
	const componentModel = await (await fetch('../res/triangle.json')).json()
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

$('#show-controls-button').onclick = toggleControls
$('#rows-input').onclick = changeNumRows
$('#rows-input').onblur = changeNumRows
$('#rows-input').onkeypress = (e) => e.key == 'Enter' ? changeNumRows(e) : e
$('#cols-input').onclick = changeNumCols
$('#cols-input').onblur = changeNumCols
$('#cols-input').onkeypress = (e) => e.key == 'Enter' ? changeNumCols(e) : e

// Initial state

$('#rows-input').value = 3
$('#cols-input').value = 3

makeTriangleGrid([
	[0, 1, 0],
	[0, 1, 0],
	[1, 0, 1],
])

makeTriangleGrid([
	[1],
	[1],
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
