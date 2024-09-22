import { $ } from './common.js'
import * as matLib from './matrix-lib.js'

export default class Scene {

	constructor (width, height) {
		this.canvasSize = {
			width: width || "100%",
			height: height || "100%",
		}

		this.gl = this._initGl()

		this.matrices = {
			model: matLib.identity,
			view: matLib.identity,
			projection: matLib.identity,
		}

		return this
	}

	rotate (x, y, z) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.rotate(x, y, z)
		)

		return this
	}

	translate (x, y, z) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.translate(x, y, z)
		)

		return this
	}

	project (scale, aspect = 1) {
		this.matrices.projection = matLib.project(scale, aspect)

		return this
	}

	scale (x, y = x, z = x) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.scale(x, y, z)
		)

		return this
	}

	drawTriangles (positions, colors) {
		this.draw(positions, colors, this.gl.TRIANGLES)

		return this
	}

	drawLines (positions, colors) {
		this.draw(positions, colors, this.gl.LINES)

		return this
	}

	draw (positions, colors, mode) {
		const gl = this.gl
		const matrices = this.matrices
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

		// Transform

		const uModelMat = gl.getUniformLocation(program, 'uModelMat')
		const uProjectionMat = gl.getUniformLocation(program, 'uProjectionMat')
		const uViewMat = gl.getUniformLocation(program, 'uViewMat')

		gl.uniformMatrix4fv(uModelMat, false, matrices.model.flat())
		gl.uniformMatrix4fv(uProjectionMat, false, matrices.projection.flat())
		gl.uniformMatrix4fv(uViewMat, false, matrices.view.flat())

		// Draw

		gl.drawArrays(mode, 0, positions.length / 3)

		return this
	}

	reset () {
		this.matrices.model = matLib.identity

		return this
	}

	clear () {
		const gl = this.gl

		gl.clear(gl.COLOR_BUFFER_BIT)
	}

	resizeCanvas (width, height) {
		const gl = this.gl

		gl.canvas.width = width
		gl.canvas.height = height
		gl.viewport(0, 0, width, height)

		return this
	}

	_initGl () {
		// Setup

		const canvas = document.createElement('canvas')

		$('main').append(canvas)

		canvas.width = this.canvasSize.width == "100%"
			? canvas.parentElement.clientWidth
			: height

		canvas.height = this.canvasSize.height == "100%"
			? canvas.parentElement.clientHeight
			: width

		const gl = canvas.getContext('webgl')

		if(gl == null) {
			throw 'WebGL is unsupported by this browser.'
		}

		// Setup WebGL

		gl.enable(gl.DEPTH_TEST)

		// Vertex shader

		const vertexShader = gl.createShader(gl.VERTEX_SHADER)

		const vsSource = `
			attribute vec4 aVertPos;
			attribute vec4 aVertColor;

			uniform mat4 uModelMat;
			uniform mat4 uProjectionMat;
			uniform mat4 uViewMat;

			varying lowp vec4 vColor;

			void main(void) {
				gl_Position = uModelMat * uViewMat * aVertPos * uProjectionMat;
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
}
