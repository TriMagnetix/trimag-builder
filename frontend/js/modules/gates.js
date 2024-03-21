import { svg, group, path, circle } from './svg-lib.js'

export const triangle = ({
	base: b,
	vertexRad: vr,
	sideRad: sr,
	extrusion: e,
}) => {
	const root3 = Math.sqrt(3)
	const root3_2 = root3 / 2
	const w = b
	const h = 0.5 * b * root3

	return group()
		.shapes([
			path()
			.m(w / 2 - vr, vr)
			.a(vr, vr, 2 * vr, 0)
			.l(0, e)
			.a(
				sr, sr,
				w / 2 - vr - 0.5 * vr - root3_2 * e,
				h - 2 * vr - root3_2 * vr - 1.5 * e,
				0
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
				0
			)
			.l(0, -e)
		])
}
