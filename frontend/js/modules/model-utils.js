// TODO: fix this so that exterior is not always true
export const extrudePoints = (points, layers) => Array(layers).fill(0)
	.map((_, z) => points
		.map((row, y) => row
			.map((p, x) => ({
				...p,
				z,
				exterior:
					!points[0][x - 1]?.[y]
					|| !points[0][x + 1]?.[y]
					|| !points[0][x]?.[y - 1]
					|| !points[0][x]?.[y + 1],
			}))
		)
	)

export const createTetrahedrons = points => {
	const maxDist = 1
	const groups = []
	const tetrahedrons = []

	const distance = (p1, p2) => Math.sqrt(
		Math.pow(p1.x - p2.x, 2)
		+ Math.pow(p1.y - p2.y, 2)
		+ Math.pow(p1.z - p2.z, 2)
	)

	// Create groups
	for (let i = 0; i < points.length; i++) {
		for (let j = 0; j < points[i].length; j++) {
			for (let k = 0; k < points[i][j].length; k++) {
				if (points[i][j][k] == undefined) continue
				if (points[i][j][k].used) continue

				const group = {
					center: points[i][j][k],
					perimeter: [
						points[i - 1]?.[j]?.[k],
						points[i + 1]?.[j]?.[k],
						points[i]?.[j - 1]?.[k],
						points[i]?.[j + 1]?.[k],
						points[i]?.[j]?.[k - 1],
						points[i]?.[j]?.[k + 1],
					].filter(p => p)
				}

				group.center.used = true
				group.perimeter.forEach(p => p.used = true)

				groups.push(group)
			}
		}
	}

	// Connect nodes
	groups.forEach(g => {
		if (g.perimeter.length < 2) return

		const used = new Set()

		g.perimeter.forEach(p1 => {
			const candidates = g.perimeter
				.sort((p2, p3) => distance(p1, p2) - distance(p1, p3))
				.slice(1)

			candidates.forEach(p2 => {
				const p2s = p => `(${p.x},${p.y},${p.z})`
				const ps2s = (p1, p2, p3) => 
					p2s(p1) + p2s(p2) + p2s(p3)

				const p3 = candidates
					.slice(1)
					.find(p3 => !used.has(ps2s(p1, p2, p3)))

				if (p3 == undefined) return
				if (p1.x == p2.x && p2.x == p3.x) return
				if (p1.y == p2.y && p2.y == p3.y) return
				if (p1.z == p2.z && p2.z == p3.z) return

				used.add(ps2s(p1, p2, p3))
				used.add(ps2s(p1, p3, p2))
				used.add(ps2s(p2, p1, p3))
				used.add(ps2s(p2, p3, p1))
				used.add(ps2s(p3, p1, p2))
				used.add(ps2s(p3, p2, p1))

				tetrahedrons.push([g.center, p1, p2, p3])
			})
		})
	})

	// Clean up
	points.forEach(p => {
		delete p.used
	})

	return tetrahedrons
}

const extrudeSquare = (square, extrusionLength) => {
	return square.map((point) => {
		return {...point, y: point.y + extrusionLength}
	})
}

/**
 * Rotates a 3D point around a specified center point on the XY plane.
 * The Z coordinate remains unchanged.
 *
 * @param {object} point - The point to rotate, e.g., {x: 1, y: 2, z: 3}.
 * @param {object} center - The center of rotation, e.g., {x: 0, y: 0, z: 0}.
 * @param {number} angleDegrees - The rotation angle in degrees.
 * Positive values mean counter-clockwise.
 * Negative values mean clockwise.
 * @returns {object} The rotated point.
 */
const rotatePointXY = (point, center, angleDegrees) => {
    const angleRadians = angleDegrees * Math.PI / 180; // Convert degrees to radians
    const cosTheta = Math.cos(angleRadians); // Handles positive and negative angles correctly
    const sinTheta = Math.sin(angleRadians); // Handles positive and negative angles correctly

    // 1. Translate the point so the center of rotation is at the origin
    const translatedX = point.x - center.x;
    const translatedY = point.y - center.y;

    // 2. Apply the 2D rotation on the XY plane
    const rotatedTranslatedX = translatedX * cosTheta - translatedY * sinTheta;
    const rotatedTranslatedY = translatedX * sinTheta + translatedY * cosTheta;

    // 3. Translate the point back
    const rotatedX = rotatedTranslatedX + center.x;
    const rotatedY = rotatedTranslatedY + center.y;
    const rotatedZ = point.z; // Z coordinate remains unchanged

    return { x: rotatedX, y: rotatedY, z: rotatedZ };
}

/**
 * Represents the possible states of magnetization.
 * @enum {MagnetizationState}
 */
const Magnetization = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NONE: 'none',
};

/**
 * @typedef {('positive'|'negative'|'none')} MagnetizationState
 */

/**
 * @typedef {Object} Point
 * @property {boolean} exterior - If this point is visible when rendering.
 * @property {number} x - The x coordinate of the point.
 * @property {number} y - The y coordinate of the point.
 * @property {number} z - The z coordinate of the point.
 */

/**
 * @typedef {Object} MagneticField
 * @property {Array<Point>} points - 
 * Array of length 8 containing all the points of the rectangular cuboid field
 * @property {MagnetizationState} magentization - Negative or positive magnetization
 */

/** 
 * @typedef {Object} TriangleMagnetization
 * @property {MagnetizationState} a - The magnetization state of the top left vertex in a triangle. 
 * This can be also be the top for a flipped triangle
 * @property {MagnetizationState} b - The magnetization state of the top right vertex in a triangle. 
 * This can be also be the bottom right vertex for a flipped triangle.
 * @property {MagnetizationState} c - The magnetization state of the bottom vertex in a triangle. 
 * This can be also be the for a bottom left vertex flipped triangle.
 */

/**
 * Given a triangle magnetization points and offsets calculat the magnetic field around each point. 
 * This will be a rectangular cuboid so it will contain 8 points and a magnetization.
 * @param {TriangleMagnetization} triangleMagnetization
 * @returns {Array<MagneticField>}
 */
const getMagnetizationBlocks = (triangleMagnetization, bounds, isEvenRow, widthOffset, heightOffset) => {
	const halfWidthOfArm = .001362 * 2
	const halfDepthOfArm = .0005
	/** @type {number} */
	const minY = bounds.min.y;
	// This is the 'a' vertex of the triangle, for b and c we will simply rotate the points since it will be easier
	const squareCoordinates = [
		{
			x: -halfWidthOfArm,
			y: minY,
			z: -halfDepthOfArm,
		},
		{
			x: -halfWidthOfArm,
			y: minY,
			z: halfDepthOfArm,
		},
		{
			x: halfWidthOfArm,
			y: minY,
			z: halfDepthOfArm,
		},
		{
			x: halfWidthOfArm,
			y: minY,
			z: -halfDepthOfArm,
		},
	]
	const center = {x: (bounds.min.x + bounds.max.x) / 2, y: (bounds.min.y + bounds.max.y) / 2, z: 0}
	let regtangularCuboidPointA = [squareCoordinates, extrudeSquare(squareCoordinates, center.y - minY)]
	// flip if we are in an even row since the triangle is the other side up 
	if(isEvenRow) {
		regtangularCuboidPointA = regtangularCuboidPointA.map((square) => {
			return square.map((point) => rotatePointXY(point, center, 180))
		})
	}

	/** @type Array<MagneticField> */
	const magnetizationFields = [];
	if (triangleMagnetization.a !== Magnetization.NONE) {
		// offset each point and add magentization to object and add to array
		magnetizationFields.push({
			magentization: triangleMagnetization.a,
			points: regtangularCuboidPointA.map((square) => square.map((point) => ({...point, x: point.x + widthOffset, y: point.y + heightOffset}))),
		})
	}
	if (triangleMagnetization.b !== Magnetization.NONE) {
		const regtangularCuboidPointB = regtangularCuboidPointA.map((square) => {
			return square.map((point) => rotatePointXY(point, center, -150))
		})
		magnetizationFields.push({
			magentization: triangleMagnetization.b,
			points: regtangularCuboidPointB.map((square) => square.map((point) => ({...point, x: point.x + widthOffset, y: point.y + heightOffset}))),
		})
	}
	if (triangleMagnetization.c !== Magnetization.NONE) {
		const regtangularCuboidPointC = regtangularCuboidPointA.map((square) => {
			return square.map((point) => rotatePointXY(point, center, 150))
		})
		magnetizationFields.push({
			magentization: triangleMagnetization.c,
			points: regtangularCuboidPointC.map((square) => square.map((point) => ({...point, x: point.x + widthOffset, y: point.y + heightOffset}))),
		})
	}
	return magnetizationFields;
}

export const arrangeModel = (positionGrid, magnetizationGrid, componentModel, padding) => {
	const bounds = componentModel.flat().reduce((acc, point) => ({
		min: {
			x: point.x < acc.min.x ? point.x : acc.min.x,
			y: point.y < acc.min.y ? point.y : acc.min.y,
		},
		max: {
			x: point.x > acc.max.x ? point.x : acc.max.x,
			y: point.y > acc.max.y ? point.y : acc.max.y,
		}
	}), {min: {x: 0, y: 0}, max: {x: 0, y: 0}})
	// TODO: include the pivot, width, and height within the component model
	const pivot = {x: 0, y: 1 / 3.093}
	const width = (bounds.max.x - bounds.min.x) * (1 + padding.x)
	const height = (bounds.max.y - bounds.min.y) * (1 + padding.y)

	const offset = {x: width * pivot.x, y: height * pivot.y}

	const flipModelIfNeeded = (componentModel, i) => i % 2 == 1
		? componentModel.map(tetrahedron =>
			tetrahedron.map(point => ({
				...point,
				x: -point.x + offset.x,
				y: -point.y + offset.y,
			}))
		)
		: componentModel

	const adjustPoints = (i, j) => flipModelIfNeeded(componentModel, i)
		.map(tetrahedron =>
			tetrahedron.map(point => ({
				...point,
				x: point.x + j * width,
				y: point.y + i * height,
			}))
		)

	const tetrahedrons = positionGrid.flatMap((row, i) =>
		row.map((col, j) =>
			col ? adjustPoints(i, j) : false
		)
	).filter(t => t).flat()

	const magnetizationBlocks = magnetizationGrid.reduce((accumulator, row, i) => {
		const isEvenRow = i % 2 === 0
		row.forEach((triangleMagnetization, j) => {
			accumulator.push(...getMagnetizationBlocks(triangleMagnetization, bounds, isEvenRow, j * width, i * height))
		})
		return accumulator
	}, [])

	return {tetrahedrons, magnetizationBlocks}
}

/**
 * Checks if a point is inside a prism using vector projection.
 * Works for any orientation (rotated or axis-aligned).
 * @param {object} point - The point to check, e.g., {x: 0.027, y: 0.020, z: 0.0}.
 * @param {object} cuboid - The cuboid object from your data structure.
 * @returns {boolean} - True if the point is inside, false otherwise.
 */
const isPointInsidePrism = (point, cuboid) => {
	/**
	 * Subtracts one vector from another (v1 - v2).
	 * @param {object} v1 - The first vector, e.g., {x: 1, y: 2, z: 3}.
	 * @param {object} v2 - The second vector to subtract, e.g., {x: 4, y: 5, z: 6}.
	 * @returns {object} A new vector representing the result of the subtraction.
	*/
	function subtract(v1, v2) {
		return {
			x: v1.x - v2.x,
			y: v1.y - v2.y,
			z: v1.z - v2.z
		};
	}
	/**
	 * Calculates the dot product of two vectors.
	 * @param {object} v1 - The first vector, e.g., {x: 1, y: 2, z: 3}.
	 * @param {object} v2 - The second vector, e.g., {x: 4, y: 5, z: 6}.
	 * @returns {number} The dot product (a scalar).
	 */
	function dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	}

	const rect1 = cuboid.points[0];
	const rect2 = cuboid.points[1];

	// 1. Define the prism's local coordinate system from one corner.
	const p0 = rect1[0]; // Origin corner

	// Vector for the width (along X in your data)
	const u = subtract(rect1[3], p0);

	// Vector for the height (along Y in your data)
	const v = subtract(rect2[0], p0);

	// Vector for the length (along Z in your data)
	const w = subtract(rect1[1], p0);

	// 2. Create a vector from the prism origin to the point to check.
	const toPoint = subtract(point, p0);

	// 3. Project the point's vector onto the prism's axes and check bounds.
	const proj_u = dot(toPoint, u) / dot(u, u);
	const proj_v = dot(toPoint, v) / dot(v, v);
	const proj_w = dot(toPoint, w) / dot(w, w);

	return (
		proj_u >= 0 && proj_u <= 1 &&
		proj_v >= 0 && proj_v <= 1 &&
		proj_w >= 0 && proj_w <= 1
	);
}

export const drawModel = (scene, tetrahedrons, magnetizationBlocks) => {
	let colors, positions

	// Only render triangles that are on the surface

	const triangles = tetrahedrons
		.flatMap(([p1, p2, p3, p4]) => [
			[p1, p2, p3],
			[p1, p2, p4],
			[p1, p3, p4],
			[p2, p3, p4],
		])

	// Render solid trianlges

	positions = triangles
		.flatMap(([p1, p2, p3]) => [
			p1.x, p1.y, p1.z,
			p2.x, p2.y, p2.z,
			p3.x, p3.y, p3.z,
		])
	
	console.log("magnetizationBlocks", magnetizationBlocks)
	
	colors = Array(positions.length / 3).fill(0)
		.flatMap((_, i) => {
			const green = [0, 0.5, 0, 1]
			const limeGreen = [0.195, 0.801, 0.195, 1]
			const darkGreen = [0, 0.2, 0, 1]
			const lightGreen = [0, 1, 0, 1]
			const magBlue = [0.5294117647058824, 0.5725490196078431, 0.8980392156862745, 1]
			const magRed = [0.9411764705882353, 0.4666666666666667, 0.4666666666666667, 1]

			const currPoint = {x: positions[i*3], y: positions[i*3+1], z: positions[i*3+2]}
			for (const magBlock of magnetizationBlocks) {
				if(isPointInsidePrism(currPoint, magBlock)) {
					if(magBlock.magentization === Magnetization.NEGATIVE) {
						return magBlue
					} else if (magBlock.magentization === Magnetization.POSITIVE) {
						return magRed;
					}
					break;
				}
			}

			return lightGreen
		})
	
	scene.drawTriangles(positions, colors)

	// Render Outlines

	positions = triangles.flatMap(([p1, p2, p3]) => [
		p1.x, p1.y, p1.z,
		p2.x, p2.y, p2.z,
		p2.x, p2.y, p2.z,
		p3.x, p3.y, p3.z,
		p3.x, p3.y, p3.z,
		p1.x, p1.y, p1.z,
	])

	colors = Array(positions.length / 3)
		.fill(0)
		.flatMap(c => [0, 0, 0, 1])

	scene.drawLines(positions, colors)
}

export const centerScene = (scene, tetrahedrons, magnetizationBlocks) => {
	const Xs = new Set(tetrahedrons.flatMap(t => t.map(p => p.x)))
	const Ys = new Set(tetrahedrons.flatMap(t => t.map(p => p.y)))
	const Zs = new Set(tetrahedrons.flatMap(t => t.map(p => p.z)))
	const width = Math.max(...Xs) - Math.min(...Xs)
	const height = Math.max(...Ys) - Math.min(...Ys)
	const depth = Math.max(...Zs) - Math.min(...Zs)

	scene
		.reset()
		.translate(
			-width / 2 - Math.min(...Xs),
			-height / 2 - Math.min(...Ys),
			-depth / 2 - Math.min(...Zs),
		)
		.scale(3 / Math.max(width, height))
		.rotate(0.01, 0.01, 0) // outlines are invisible if viewed perfectly from the front
		.clear()

	drawModel(scene, tetrahedrons, magnetizationBlocks)
}
