import { svg, group, path, circle } from './svg-lib.js'

// Draws a concave triangle according
// to the provided parameters
// 
// returns an svg object (concave triangle)
export const triangle = ({
	position: {x, y},	// Position in space
	width: w,			// Size of the base
	vertexRad: vr,		// Curvature of the tips
	sideRad: sr,		// Curvature of the sides
	extrusion: e,		// Length of the arms
}) => {
	const root3 = Math.sqrt(3)
	const root3_2 = root3 / 2
	const h = 0.5 * w * root3

	return group()
		.shapes([
			path()
			.M(x, y)
			.m(w / 2 - vr, vr)
			.a(vr, vr, 2 * vr, 0)
			.l(0, e)
			.a(
				sr, sr,
				w / 2 - vr - 0.5 * vr - root3_2 * e,
				h - 2 * vr - root3_2 * vr - 1.5 * e,
				0,
			)
			.l(root3_2 * e, 0.5 * e)
			.a(vr, vr, -vr, root3 * vr)
			.l(-root3_2 * e, -0.5 * e)
			.a(sr, sr, -w + 3 * vr + root3 * e, 0, 0)
			.l(-root3_2 * e, 0.5 * e)
			.a(vr, vr, -vr, -root3 * vr)
			.l(root3_2 * e, -0.5 * e)
			.a(
				sr, sr,
				w / 2 - 1.5 * vr - root3_2 * e,
				-h + (1 + root3_2) * vr + vr + 1.5 * e,
				0,
			)
			.l(0, -e)
		])
}

// Draws an upside-down concave triangle
// according to the provided parameters
// 
// returns an svg object (upside-down concave triangle)
export const invertedTriangle = ({
	position: {x, y},	// Position in space
	width: w,			// Size of the base
	vertexRad: vr,		// Curvature of the tips
	sideRad: sr,		// Curvature of the sides
	extrusion: e,		// Length of the arms
}) => {
	const root3 = Math.sqrt(3)
	const root3_2 = root3 / 2
	const h = 0.5 * w * root3

	return group()
		.shapes([
			path()
			.M(x, y)
			.m(w / 2 - vr, h - vr)
			.a(vr, vr, 2 * vr, 0, 0)
			.l(0, -e)
			.a(
				sr, sr,
				w / 2 - vr - 0.5 * vr - root3_2 * e,
				-h + 2 * vr + root3_2 * vr + 1.5 * e,
			)
			.l(root3_2 * e, -0.5 * e)
			.a(vr, vr, -vr, -root3 * vr, 0)
			.l(-root3_2 * e, 0.5 * e)
			.a(sr, sr, -w + 3 * vr + root3 * e, 0)
			.l(-root3_2 * e, -0.5 * e)
			.a(vr, vr, -vr, root3 * vr, 0)
			.l(root3_2 * e, 0.5 * e)
			.a(
				sr, sr,
				w / 2 - 1.5 * vr - root3_2 * e,
				h - (1 + root3_2) * vr - vr - 1.5 * e,
			)
			.l(0, e)
		])
}

// Draws an arrangement of several concave triangles
// according to the provided parameters
//
// returns an svg object (arrangement of triangles)
export const arrangement = ({
	positionGrid: pg,		// [[0, 1, 0], ...] -- 1s are where triangles get placed
	spacing: s,				// Space between triangles
	triangleSpecs: {
		width: w,			// Size of the bases
		vertexRad: vr,		// Curvature of the tips
		sideRad: sr,		// Curvature of the sides
		extrusion: e,		// Length of the arms
	}
}) => {
	const h = 0.5 * w * Math.sqrt(3)
	const shapes = []
	let br = 0 // blank rows
	let bc = 0 // blank columns

	// count blank rows
	for (let i = 0; i < pg.length; i++) {
		let empty = true

		for (let j = 0; j < pg[i].length; j++)
			empty = empty && pg[i][j] == 0

		if (!empty) break

		br++
	}

	// count blank columns
	for (let j = 0; j < pg[0].length; j++) {
		let empty = true

		for (let i = 0; i < pg.length; i++)
			empty = empty && pg[i][j] == 0

		if (!empty) break

		bc++
	}

	// draw triangles
	pg.forEach((row, i) => row.forEach((col, j) => col && shapes.push(
		(i % 2 ? triangle : invertedTriangle)({
			position: {
				x: w * j
					+ Math.sqrt(3) * j * (vr + 0.5 * s)
					- Math.sqrt(3) * bc * (vr + 0.5 * s)
					- (j - bc) * 2 * vr
					- w * bc,
				y: h * i
					+ i % 2 * (2 * vr + s)
					+ Math.floor(i / 2) * (3 * vr + 1.5 * s)
					- br % 2 * (2 * vr + s)
					- Math.floor(br / 2) * (3 * vr + 1.5 * s)
					- (i - br) * 2 * vr
					- h * br,
			},
			...triangleSpecs
		})
	)))

	return group()
		.shapes(shapes)
}
