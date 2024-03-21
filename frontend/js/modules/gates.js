import { svg, group, path, circle } from './svg-lib.js'

export const triangle = ({
	base: b,
	vertexRad: vr,
	sideRad: sr,
}) => {
	const w = b
	const h = 0.5 * b * Math.sqrt(3)

	return group()
		.shapes([
			path()
			.m(w / 2 - vr, vr)
			.a(vr, vr, 2 * vr, 0)
			.a(sr, sr, w / 2 - vr - 0.5 * vr, h - 2 * vr - (Math.sqrt(3) / 2) * vr, 0)
			.a(vr, vr, -vr, Math.sqrt(3) * vr)
			.a(sr, sr, -w + 3 * vr, 0, 0)
			.a(vr, vr, -vr, -Math.sqrt(3) * vr)
			.a(sr, sr, w / 2 - 1.5 * vr, -h + (1 + Math.sqrt(3) / 2) * vr + vr, 0)
		])
}
