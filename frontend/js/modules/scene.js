/**
 * @module scene
 * @description A module representing a WebGL scene for 3D rendering operations
 */

import { $ } from './common.js'
import * as matLib from './matrix-lib.js'

export default class Scene {

	/**
	 * Creates an instance of Scene
	 *
	 * @param {number|string} [width="100%"] - The width of the canvas
	 * @param {number|string} [height="100%"] - The height of the canvas
	 */
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

	/**
	 * Applies rotation to the model matrix
	 *
	 * @param {number} x - Rotation angle around the X-axis
	 * @param {number} y - Rotation angle around the Y-axis
	 * @param {number} z - Rotation angle around the Z-axis
	 * @returns {Scene} The current Scene instance
	 */
	rotate (x, y, z) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.rotate(x, y, z)
		)

		return this
	}

	/**
	 * Applies translation to the model matrix
	 *
	 * @param {number} x - Translation along the X-axis
	 * @param {number} y - Translation along the Y-axis
	 * @param {number} z - Translation along the Z-axis
	 * @returns {Scene} The current Scene instance
	 */
	translate (x, y, z) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.translate(x, y, z)
		)

		return this
	}

	/**
	 * Applies a projection to the scene
	 *
	 * @param {number} scale - The scale factor for the projection
	 * @param {number} [aspect=1] - The aspect ratio for the projection
	 * @returns {Scene} The current Scene instance
	 */
	project (scale, aspect = 1) {
		this.matrices.projection = matLib.project(scale, aspect)

		return this
	}

	/**
	 * Scales the model matrix
	 *
	 * @param {number} x - Scale factor along the X-axis
	 * @param {number} [y=x] - Scale factor along the Y-axis
	 * @param {number} [z=x] - Scale factor along the Z-axis
	 * @returns {Scene} The current Scene instance
	 */
	scale (x, y = x, z = x) {
		this.matrices.model = matLib.matrixMult(
			this.matrices.model,
			matLib.scale(x, y, z)
		)

		return this
	}

	/**
	 * Draws triangles using the given positions and colors.
	 * @param {Float32Array} positions - The vertex positions.
	 * @param {Float32Array} colors - The vertex colors.
	 * @returns {Scene} The current Scene instance.
	 */
	drawTriangles (positions, colors) {
		this.draw(positions, colors, this.gl.TRIANGLES)

		return this
	}
  
	/**
	 * Draws lines using the given positions and colors.
	 * @param {Float32Array} positions - The vertex positions.
	 * @param {Float32Array} colors - The vertex colors.
	 * @returns {Scene} The current Scene instance.
	 */
	drawLines (positions, colors) {
		this.draw(positions, colors, this.gl.LINES)

		return this
	}

	/**
	 * Draws geometry based on positions, colors, and drawing mode.
	 * @param {Float32Array} positions - The vertex positions.
	 * @param {Float32Array} colors - The vertex colors.
	 * @param {GLenum} mode - The drawing mode (e.g., gl.TRIANGLES, gl.LINES).
	 * @returns {Scene} The current Scene instance.
	 */
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

	/**
	 * Resets the model matrix to the identity matrix.
	 * @returns {Scene} The current Scene instance.
	 */
	reset () {
		this.matrices.model = matLib.identity

		return this
	}

	/**
	 * Clears the canvas.
	 */
	clear () {
		const gl = this.gl

		gl.clear(gl.COLOR_BUFFER_BIT)
	}

	/**
	 * Resizes the canvas to the given width and height.
	 * @param {number} width - The new width of the canvas.
	 * @param {number} height - The new height of the canvas.
	 * @returns {Scene} The current Scene instance.
	 */
	resizeCanvas (width, height) {
		const gl = this.gl

		gl.canvas.width = width
		gl.canvas.height = height
		gl.viewport(0, 0, width, height)

		return this
	}

	/**
	 * Initializes the WebGL context and sets up shaders.
	 * @returns {WebGLRenderingContext} The WebGL rendering context.
	 * @throws {string} Throws an error if WebGL is not supported.
	 * @private
	 */
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
