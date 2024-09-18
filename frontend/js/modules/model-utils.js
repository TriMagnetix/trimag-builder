export const extrudePoints = (points, layers) => Array(layers).fill(0)
	.map((_, z) => points.map(p => ({...p, z})))
	.flat()

export const createTetrahedrons = points => {
	const maxDist = 1
	const groups = []
	const tetrahedrons = []

	const distance = (p1, p2) => Math.sqrt(
		Math.pow(p1.x - p2.x, 2)
		+ Math.pow(p1.y - p2.y, 2)
		+ Math.pow(p1.z - p2.z, 2)
	)

	// TODO: Optimize by improving points datastructure so they can be referenced by index
	// Create groups
	console.log('grouping...')
	points.forEach(p1 => {
		if (groups.length % 100 == 0) console.log(groups.length)
		if (p1.used) return

		const group = {center: p1, perimeter: []}

		p1.used = true

		points.forEach(p2 => {
			if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) return
			if (distance(p1, p2) > maxDist) return

			group.perimeter.push(p2)

			p2.used = true
		})

		groups.push(group)
	})

	// Connect nodes
	console.log('building tetrahedrons...')
	groups.forEach(g => {
		if (tetrahedrons.length % 100 == 0) console.log(tetrahedrons.length)
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
		.filter(t =>
			t.every(p => p.exterior)
			&& (
				t.every(p => p.x == t[0].x)
				|| t.every(p => p.y == t[0].y)
				|| t.every(p => p.z == t[0].z)
			)
		)

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

			return i % 3 == i % 6 ? green : lightGreen
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
		.scale(1.5 / Math.max(width, height))
		.clear()

	drawModel(scene, tetrahedrons)
}
