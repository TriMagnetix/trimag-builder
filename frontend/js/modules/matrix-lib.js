export const identity = [
	[1, 0, 0, 0],
	[0, 1, 0, 0],
	[0, 0, 1, 0],
	[0, 0, 0, 1],
]

export const matrixMult = (a, b) => {
	if (a[0]?.length != b.length) {
		throw "incompatible dimensions"
	}

	const result = Array(a.length)
		.fill(0)
		.map(_ =>
			Array(b[0].length)
			.fill(0)
		)

	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b[0].length; j++) {
			for (let k = 0; k < b.length; k++) {
				result[i][j] += a[i][k] * b[k][j]
			}
		}
	}

	return result
}

export const translate = (x, y, z) => [
	[1, 0, 0, 0],
	[0, 1, 0, 0],
	[0, 0, 1, 0],
	[x, y, z, 1],
]

export const scale = (x, y, z) => [
	[x, 0, 0, 0],
	[0, y, 0, 0],
	[0, 0, z, 0],
	[0, 0, 0, 1],
]

export const rotate = (x, y, z) => {
	// X rotation

	const xSin = Math.sin(x)
	const xCos = Math.cos(x)

	const xMat = [
		[1, 0, 0, 0],
		[0, xCos, -xSin, 0],
		[0, xSin, xCos, 0],
		[0, 0, 0, 1],
	]

	// Y rotation

	const ySin = Math.sin(y)
	const yCos = Math.cos(y)

	const yMat = [
		[yCos, 0, 0, ySin],
		[0, 1, 0, 0],
		[-ySin, 0, yCos, 0],
		[0, 0, 0, 1],
	]

	// Z rotation

	const zSin = Math.sin(z)
	const zCos = Math.cos(z)

	const zMat = [
		[zCos, -zSin, 0, 0],
		[zSin, zCos, 0, 0],
		[0, 0, 1, 0],
		[0, 0, 0, 1],
	]

	return matrixMult(matrixMult(xMat, yMat), zMat)
}

export const project = scale => [
	[1, 0, 0, 0],
	[0, 1, 0, 0],
	[0, 0, 1, scale],
	[0, 0, 0, scale],
]
