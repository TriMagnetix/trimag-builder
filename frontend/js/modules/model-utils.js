import { Magnetization } from '../types.js'
/**
 * Top level import from types .d.ts file so we 
 * don't need to import every type individually
 * @typedef {import('../types').Types} Types
 */

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

/**
 * Extrudes a 2D square (represented by 4 points) along the Y-axis.
 * This effectively "lifts" the square by adding a specified length to each point's Y-coordinate.
 *
 * @param {Array<Types['Point']>} square - An array of four points representing the vertices of the square.
 * @param {number} extrusionLength - The distance by which to extrude the square along the Y-axis.
 * @returns {Array<Types['Point']>} A new array of four points, with their Y-coordinates increased by `extrusionLength`.
 */
const extrudeSquare = (square, extrusionLength) => {
    return square.map((point) => {
        return {...point, y: point.y + extrusionLength}
    });
};

/**
 * Rotates a 3D point around a specified center point on the XY plane.
 * The Z coordinate remains unchanged.
 *
 * @param {Types['Point']} point - The point to rotate
 * @param {Types['Point']} center - The center of rotation
 * @param {number} angleDegrees - The rotation angle in degrees.
 * Positive values mean counter-clockwise.
 * Negative values mean clockwise.
 * @returns {Types['Point']} The rotated point.
 */
const rotatePointXY = (point, center, angleDegrees) => {
    const angleRadians = angleDegrees * Math.PI / 180 // Convert degrees to radians
    const cosTheta = Math.cos(angleRadians)
    const sinTheta = Math.sin(angleRadians)
    const translatedX = point.x - center.x
    const translatedY = point.y - center.y
    const rotatedTranslatedX = translatedX * cosTheta - translatedY * sinTheta
    const rotatedTranslatedY = translatedX * sinTheta + translatedY * cosTheta
    const rotatedX = rotatedTranslatedX + center.x
    const rotatedY = rotatedTranslatedY + center.y

    return { x: rotatedX, y: rotatedY, z: point.z }
}

/**
 * Checks if a point is inside an axis-aligned bounding box.
 * @param {Types['Point']} point - The point to check, e.g., {x, y, z}.
 * @param {Types['Bounds']} aabb - The AABB object.
 * @returns {boolean} - True if the point is inside, false otherwise.
 */
const isPointInsideAABB = (point, aabb) => {
    return (
        point.x >= aabb.min.x && point.x <= aabb.max.x &&
        point.y >= aabb.min.y && point.y <= aabb.max.y &&
        point.z >= aabb.min.z && point.z <= aabb.max.z
    );
}

/**
 * Calculates the axis-aligned bounding box for a set of 8 points. This makes it a lot quicker 
 * to see if a point is anywhere close to the rectangular cuboid (magnetization field).
 * https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
 * @param {Array<Array<Types['Point']>>} points - A list of two arrays, each containing 4 points.
 * @returns {Types['Bounds']} - The AABB.
 */
const calculateAABB = (points) => {
    const allPoints = points.flat();

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const point of allPoints) {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
        if (point.z < minZ) minZ = point.z;
        if (point.z > maxZ) maxZ = point.z;
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ }
    };
}

/**
 * @param {Types['Magnetization']} magnetization
 * @param {boolean} isEvenRow
 * @param {"a" | "b" | "c"} armLetter
 * @returns {Types['Vector']}
 */
const calculateVector = (magnetization, isEvenRow, armLetter) => {
	// For the base vectors assume that arms are pointing outward
	/** @type {Types['Vector']} */
	const aBaseVector = { x: 0, y: 1, z:0 }
	/** @type {Types['Vector']} */
	const bBaseVector = { x: Math.sqrt(3)/2, y: -1/2, z:0 }
	/** @type {Types['Vector']} */
	const cBaseVector = { x: -Math.sqrt(3)/2, y: -1/2, z:0 }

	/** @type {Types['Vector']} */
	let vector;

	if (armLetter === "a") {
		vector = aBaseVector
	} else if (armLetter === "b") {
		vector = bBaseVector
	} else if (armLetter === "c") {
		vector = cBaseVector
	} else {
		throw Error(`Invalid arm letter passed in: ${armLetter}`)
	}

	if (magnetization === Magnetization.POSITIVE && isEvenRow || magnetization === Magnetization.NEGATIVE && !isEvenRow) {
		return vector
	}
	return  {x: vector.x * -1, y: vector.y * -1, z: vector.z }
}

/**
 * Given a triangle magnetization points and offsets, calculates the magnetic field around each point. 
 * This will be a rectangular cuboid so it will contain 8 points and a magnetization.
 * @param {Types['TriangleMagnetization']} triangleMagnetization
 * @param {Types['Bounds']} bounds
 * @param {{min: number, max: number}} armBounds
 * @param {boolean} isEvenRow
 * @param {number} widthOffset
 * @param {number} heightOffset
 * @returns {Array<Types['MagnetizationField']>}
 */
const getMagnetizationFields = (triangleMagnetization, bounds, armBounds, isEvenRow, widthOffset, heightOffset) => {
	if(triangleMagnetization.a === Magnetization.NONE && triangleMagnetization.b === Magnetization.NONE && triangleMagnetization.c === Magnetization.NONE) {
		return []
	}
	const widthOfArm = Math.abs(armBounds.max - armBounds.min)
	const minY = bounds.min.y;
	const maxY = bounds.max.y;
	// This is the 'a' vertex of the triangle, for b and c we will simply rotate the points since it will be easier
	const squareCoordinates = [
		{
			x: -widthOfArm,
			y: minY,
			z: bounds.min.z,
		},
		{
			x: -widthOfArm,
			y: minY,
			z: bounds.max.z,
		},
		{
			x: widthOfArm,
			y: minY,
			z: bounds.max.z,
		},
		{
			x: widthOfArm,
			y: minY,
			z: bounds.min.z,
		},
	]
	// Determine the center, similar to an isosceles triangle
	const centerY = isEvenRow ?  (2 * minY + maxY) / 3 : (minY + 2 * maxY) / 3
	const center = {x: (bounds.min.x + bounds.max.x) / 2, y: centerY, z: 0}
	 
	// flip if we are in an even row since the triangle is the other side up 
	let regtangularCuboidPointA;
	if(isEvenRow) {
		const rotatedSquareCoordinates = squareCoordinates.map((point) => rotatePointXY(point, {x: (bounds.min.x + bounds.max.x) / 2, y: (bounds.min.y + bounds.max.y) / 2, z: 0}, 180))
		regtangularCuboidPointA = [rotatedSquareCoordinates, extrudeSquare(rotatedSquareCoordinates, (center.y - maxY) * 3 / 4)]
	} else {
		regtangularCuboidPointA = [squareCoordinates, extrudeSquare(squareCoordinates, (center.y - minY) * 3 / 4)]
	}

	/** @type Array<Types['MagnetizationField']> */
	const magnetizationFields = [];
	if (triangleMagnetization.a !== Magnetization.NONE) {
		// offset each point and add magnetization to object and add to array
		const points = regtangularCuboidPointA.map((square) => square.map((point) => ({ ...point, x: point.x + widthOffset, y: point.y + heightOffset })));
		magnetizationFields.push({
			magnetization: triangleMagnetization.a,
			points,
			aabb: calculateAABB(points),
			vector: calculateVector(triangleMagnetization.a, isEvenRow, "a")
		})
	}
	if (triangleMagnetization.b !== Magnetization.NONE) {
		const regtangularCuboidPointB = regtangularCuboidPointA.map((square) => {
			return square.map((point) => rotatePointXY(point, center, -120))
		})
		const points = regtangularCuboidPointB.map((square) => square.map((point) => ({ ...point, x: point.x + widthOffset, y: point.y + heightOffset })));
		magnetizationFields.push({
			magnetization: triangleMagnetization.b,
			points,
			aabb: calculateAABB(points),
			vector: calculateVector(triangleMagnetization.b, isEvenRow, "b"),
		})
	}
	if (triangleMagnetization.c !== Magnetization.NONE) {
		const regtangularCuboidPointC = regtangularCuboidPointA.map((square) => {
			return square.map((point) => rotatePointXY(point, center, 120))
		})
		const points = regtangularCuboidPointC.map((square) => square.map((point) => ({ ...point, x: point.x + widthOffset, y: point.y + heightOffset })))
		magnetizationFields.push({
			magnetization: triangleMagnetization.c,
			points,
			aabb: calculateAABB(points),
			vector: calculateVector(triangleMagnetization.c, isEvenRow, "c"),
		})
	}
	return magnetizationFields;
}

export const arrangeModel = (positionGrid, magnetizationGrid, componentModel, padding) => {
	const bounds = componentModel.flat().reduce((acc, point) => ({
		min: {
			x: point.x < acc.min.x ? point.x : acc.min.x,
			y: point.y < acc.min.y ? point.y : acc.min.y,
			z: point.z < acc.min.z ? point.z : acc.min.z,
		},
		max: {
			x: point.x > acc.max.x ? point.x : acc.max.x,
			y: point.y > acc.max.y ? point.y : acc.max.y,
			z: point.z > acc.min.z ? point.z : acc.min.z,
		}
	}), {min: {x: 0, y: 0, z: 0}, max: {x: 0, y: 0, z: 0}}) 
	const armBounds = componentModel.flat().reduce((acc, point) => {
		/* We are trying to find the width of the arm so 
		take the top arm and only look at the top 10% of 
		y points to get the min and max of the x. */
		const bottomBound = bounds.max.y - (Math.abs(bounds.max.y - bounds.min.y) / 10)
		if(point.y <= bounds.max.y && point.y >= bottomBound) {
			return {
				min: point.x < acc.min ? point.x : acc.min,
				max: point.x > acc.max ? point.x : acc.max,  
			}
		}
		return acc;
	}, {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER})
	// TODO: include the pivot, width, and height within the component model
	const pivot = {x: 0, y: 1 / 3.093}
	const width = (bounds.max.x - bounds.min.x) * (1 + padding.x)
	const height = (bounds.max.y - bounds.min.y) * (1 + padding.y)

	const offset = {x: width * pivot.x, y: height * pivot.y, z: 0}

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

	const magnetizationFields = magnetizationGrid.reduce((accumulator, row, i) => {
		const isEvenRow = i % 2 === 0
		row.forEach((triangleMagnetization, j) => {
			accumulator.push(...getMagnetizationFields(triangleMagnetization, bounds, armBounds, isEvenRow, j * width, i * height))
		})
		return accumulator
	}, [])

	return {tetrahedrons, magnetizationFields}
}

/**
 * Checks if a point is inside a prism using vector projection.
 * Works for any orientation (rotated or axis-aligned).
 * @param {Types['Point']} point - The point to check, e.g., {x: 0.027, y: 0.020, z: 0.0}.
 * @param {Types['MagnetizationField']} magField - The cuboid object from your data structure.
 * @returns {boolean} - True if the point is inside, false otherwise.
 */
const isPointInsidePrism = (point, magField) => {
	/**
	 * Subtracts one vector from another (v1 - v2).
	 * @param {Types['Vector']} v1
	 * @param {Types['Vector']} v2
	 * @returns {Types['Vector']}
	*/
	const subtract = (v1, v2) => {
		return {
			x: v1.x - v2.x,
			y: v1.y - v2.y,
			z: v1.z - v2.z
		}
	}
	/**
	 * Calculates the dot product of two vectors.
	 * @param {Types['Vector']} v1
	 * @param {Types['Vector']} v2
	 * @returns {number} The dot product
	 */
	const dot = (v1, v2) => {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
	}

	/* Do a quick check if a point is inside the aabb. If it isn't we do
	not have to do computationally harder work to figure that out. 
	If it is then we need to check if its exactly within the bounds. */
	if (!isPointInsideAABB(point, magField.aabb)) {
		return false;
	}

	const [rect1, rect2] = magField.points

	const p0 = rect1[0]

	// Vector width
	const u = subtract(rect1[3], p0)

	// Vector height
	const v = subtract(rect2[0], p0)

	// Vector length
	const w = subtract(rect1[1], p0);

	// Vector from the prism origin to the point to check
	const toPoint = subtract(point, p0);

	// Project the point's vector onto the prism's axes and check bounds.
	const uProjection = dot(toPoint, u) / dot(u, u);
	const vProjection = dot(toPoint, v) / dot(v, v);
	const wProjection = dot(toPoint, w) / dot(w, w);

	return (
		uProjection >= 0 && uProjection <= 1 &&
		vProjection >= 0 && vProjection <= 1 &&
		wProjection >= 0 && wProjection <= 1
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
		
	colors = Array(positions.length / 3).fill(0)
		.flatMap((_, i) => {
			const lightGreen = [0, 1, 0, 1]
			// #8792e5
			const magBlue = [0.5294117647058824, 0.5725490196078431, 0.8980392156862745, 1]
			// #f07777
			const magRed = [0.9411764705882353, 0.4666666666666667, 0.4666666666666667, 1]

			const currPoint = {x: positions[i*3], y: positions[i*3+1], z: positions[i*3+2]}
			for (const magBlock of magnetizationBlocks) {
				if(isPointInsidePrism(currPoint, magBlock)) {
					if(magBlock.magnetization === Magnetization.NEGATIVE) {
						return magBlue
					} else if (magBlock.magnetization === Magnetization.POSITIVE) {
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
