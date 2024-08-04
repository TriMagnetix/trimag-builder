import { $ } from './modules/common.js'

const createCanvas = (width = 500, height = 500) => {

	// Setup

	const canvas = document.createElement('canvas')

	canvas.width = width
	canvas.height = height

	const gl = canvas.getContext('webgl')

	if(gl == null) {
		throw 'WebGL is unsupported by this browser.'
	}

	$('main').append(canvas)

	// Vertex shader

	const vertexShader = gl.createShader(gl.VERTEX_SHADER)

	const vsSource = `
		attribute vec4 aVertPos;
		attribute vec4 aVertColor;

		varying lowp vec4 vColor;

		void main(void) {
			gl_Position = aVertPos;
			gl_PointSize = 10.0;
			vColor = aVertColor;
		}
	`

	gl.shaderSource(vertexShader, vsSource.trim())
	gl.compileShader(vertexShader)
	
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		throw gl.getShaderInfoLog(vertexShader)
	}

	// Fragment shader

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

	const fsSource = `
		varying lowp vec4 vColor;

		void main(void) {
			gl_FragColor = vColor;
		}
	`

	gl.shaderSource(fragmentShader, fsSource.trim())
	gl.compileShader(fragmentShader)

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		throw gl.getShaderInfoLog(fragmentShader)
	}

	// Program

	const program = gl.createProgram()

	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw gl.getProgramInfoLog(program)
	}

	gl.useProgram(program)

	return gl
}

const draw = (gl, positions, colors, mode) => {
	const program = gl.getParameter(gl.CURRENT_PROGRAM)

	// Positions

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

	const aVertPos = gl.getAttribLocation(program, 'aVertPos')

	gl.vertexAttribPointer(aVertPos, 3, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(aVertPos)

	// Colors

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

	const aVertColor = gl.getAttribLocation(program, 'aVertColor')

	gl.vertexAttribPointer(aVertColor, 4, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(aVertColor)

	// Draw

	gl.drawArrays(mode, 0, positions.length / 3)
}

const drawTriangles = (gl, triangles) => {
	let colors, positions

	// Soid triangles

	positions = triangles.flatMap(([p1, p2, p3]) => [
		p1.x / 10 - 1, p1.y / 10 - 1, p1.z,
		p2.x / 10 - 1, p2.y / 10 - 1, p2.z,
		p3.x / 10 - 1, p3.y / 10 - 1, p3.z,
	])

	colors = triangles.flatMap((t, i) => {
		const green = [0, 0.5, 0, 1]
		const limeGreen = [0.195, 0.801, 0.195, 1]

		return t.flatMap(p => i % 2 == 0 ? green : limeGreen)
	})

	draw(gl, positions, colors, gl.TRIANGLES)

	// Outlines

	positions = triangles.flatMap(([p1, p2, p3]) => [
		p1.x / 10 - 1, p1.y / 10 - 1, p1.z,
		p2.x / 10 - 1, p2.y / 10 - 1, p2.z,
		p2.x / 10 - 1, p2.y / 10 - 1, p2.z,
		p3.x / 10 - 1, p3.y / 10 - 1, p3.z,
		p3.x / 10 - 1, p3.y / 10 - 1, p3.z,
		p1.x / 10 - 1, p1.y / 10 - 1, p1.z,
	])

	colors = Array(positions.length / 3)
		.fill(0)
		.flatMap(c => [0, 0, 0, 1])

	draw(gl, positions, colors, gl.LINES)
}

const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))

const createTriangles = points => {
	const maxDist = 1
	const groups = []
	const triangles = []

	// Create groups
	points.forEach(p1 => {
		if (p1.used) return

		const group = {center: p1, perimeter: []}

		p1.used = true

		points.forEach(p2 => {
			if (p1.x == p2.x && p1.y == p2.y) return
			if (distance(p1, p2) > maxDist) return

			group.perimeter.push(p2)

			p2.used = true
		})

		groups.push(group)
	})

	// Connect nodes
	groups.forEach(g => {
		if (g.perimeter.length < 2) return

		const used = new Set()

		g.perimeter.forEach(p1 => {
			const p2 = g.perimeter
				.sort((p2, p3) => distance(p1, p2) - distance(p1, p3))
				.slice(1)
				.find(p2 => !used.has(`(${p1.x},${p1.y})(${p2.x},${p2.y})`))

			if (p2 == undefined) return

			used.add(`(${p1.x},${p1.y})(${p2.x},${p2.y})`)
			used.add(`(${p2.x},${p2.y})(${p1.x},${p1.y})`)

			triangles.push([g.center, p1, p2])
		})
	})

	// Clean up
	points.forEach(p => {
		delete p.used
	})

	return triangles
}

const gl = createCanvas()

const points = Array(10).fill(0).flatMap((_, x) =>
	Array(10).fill(0).map((_, y) => ({x, y, z: 0}))
)

const triangles = createTriangles(points)
/*
const triangles = [
  [
  	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 0, z: 0},
  ],
]
*/
drawTriangles(gl, triangles)
