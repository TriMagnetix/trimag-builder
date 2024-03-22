import { svg, group, path, circle } from './svg-lib.js'

export const triangle = ({
	position: {x, y},
	width: w,
	vertexRad: vr,
	sideRad: sr,
	extrusion: e,
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

export const invertedTriangle = ({
	position: {x, y},
	width: w,
	vertexRad: vr,
	sideRad: sr,
	extrusion: e,
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

export const arrangement = ({
	positionGrid: pg, // bool[][]
	spacing: s,
	triangleSpecs,
	triangleSpecs: {
		width: w,
		vertexRad: vr,
		sideRad: sr,
		extrusion: e,
	}
}) => {
	const h = 0.5 * w * Math.sqrt(3)
	const shapes = []

	pg.forEach((row, i) => row.forEach((col, j) => col && shapes.push(
		i % 2 ?
			triangle({
				position: {
					// TODO: fix
					//x: w * j + 0.5 * Math.sqrt(3) * s * j,
					//y: h * i + s * Math.ceil(i / 2) + 0.5 * s * Math.floor(i / 2),
					x: w * j,
					y: h * i,
				},
				...triangleSpecs
			}) :
			invertedTriangle({
				position: {
					// TODO: fix
					//x: w * j + 0.5 * Math.sqrt(3) * s * j,
					//y: h * i + s * Math.ceil(i / 2),
					x: w * j,
					y: h * i,
				},
				...triangleSpecs
			})
	)))

	return group()
		.shapes(shapes)
}
