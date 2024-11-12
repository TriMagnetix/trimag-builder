// Multiply two matrices together using dot product multiplication
//
// a and b: matrices (2d array of numbers)
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

// An identity matrix.
// This won't transform anything, so it's a good starting point
export const identity = [
	[1, 0, 0, 0],
	[0, 1, 0, 0],
	[0, 0, 1, 0],
	[0, 0, 0, 1],
]

// Create a matrix that will translate a
// coordinate in the x, y, and z dimensions
//
// x, y, and z: The amount to translate by (number)
//
// returns a matrix (2d array of numbers)
export const translate = (x, y, z) => [
	[1, 0, 0, 0],
	[0, 1, 0, 0],
	[0, 0, 1, 0],
	[x, y, z, 1],
]

// Create a matrix that will scale a coordinate
// in the x, y, and z dimensions
//
// x, y, and z: the amount to scale by (number)
//
// returns a matrix (2d array of numbers)
export const scale = (x, y = x, z = x) => [
	[x, 0, 0, 0],
	[0, y, 0, 0],
	[0, 0, z, 0],
	[0, 0, 0, 1],
]

// Create a matrix that will rotate a coordinate
// along the x, y, and z axes
//
// x, y, and z: the amount to rotate by (number)
//
// returns a matrix (2d array of numbers)
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
		[yCos, 0, ySin, 0],
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

// Creates a matrix that can project a matrix
// in 3d space to create a sense of perspective
//
// scale: Intensity of the effect
// aspect: Ratio of the width and height for the viewport
//
// returns a matrix (2d array of numbers)
export const project = (scale, aspect) => [
	[aspect > 1 ? 1 / aspect : 1, 0, 0, 0],
	[0, aspect < 1 ? aspect : 1, 0, 0],
	[0, 0, 1, scale - 0.1],
	[0, 0, scale - 1, scale],
]
