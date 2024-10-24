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

export const arrangeModel = (positionGrid, componentModel, padding) => {
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
	padding = {x: 0.01, y: 0} // TODO: don't override padding once width and height is included in the component model

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

	return positionGrid.flatMap((row, i) =>
		row.map((col, j) =>
			col ? adjustPoints(i, j) : false
		)
	).filter(t => t).flat()
}

export const drawModel = (scene, tetrahedrons) => {
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
			const green = [0, 0.5, 0, 1]
			const limeGreen = [0.195, 0.801, 0.195, 1]
			const darkGreen = [0, 0.2, 0, 1]
			const lightGreen = [0, 1, 0, 1]

			return lightGreen
			//return i % 3 == i % 6 ? green : lightGreen
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

export const centerScene = (scene, tetrahedrons) => {
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

	drawModel(scene, tetrahedrons)
}
