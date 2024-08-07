import Scene from './modules/scene.js'

const distance = (p1, p2) => Math.sqrt(
	Math.pow(p1.x - p2.x, 2)
	+ Math.pow(p1.y - p2.y, 2)
	+ Math.pow(p1.z - p2.z, 2)
)

const createTetrahedrons = points => {
	const maxDist = 1
	const groups = []
	const tetrahedrons = []

	// Create groups
	points.forEach(p1 => {
		if (p1.used) return

		const group = {center: p1, perimeter: []}

		p1.used = true

		points.forEach(p2 => {
			if (p1.x == p2.x && p1.y == p2.y) return
			if (distance(p1, p2) > maxDist) return

			group.perimeter.push(p2)

			p2.used = true
		})

		groups.push(group)
	})

	// Connect nodes
	groups.forEach(g => {
		if (g.perimeter.length < 2) return

		const used = new Set()

		g.perimeter.forEach(p1 => {
			const candidates = g.perimeter
				.sort((p2, p3) => distance(p1, p2) - distance(p1, p3))
				.slice(1)

			candidates.forEach(p2 => {
				const p3 = candidates
					.slice(1)
					.find(p3 => !used.has(
						`(${p1.x},${p1.y})(${p2.x},${p2.y})(${p3.x},${p3.y})`
					))

				if (p3 == undefined) return

				used.add(`(${p1.x},${p1.y})(${p2.x},${p2.y})(${p3.x},${p3.y})`)
				used.add(`(${p1.x},${p1.y})(${p3.x},${p3.y})(${p2.x},${p2.y})`)
				used.add(`(${p2.x},${p2.y})(${p1.x},${p1.y})(${p3.x},${p3.y})`)
				used.add(`(${p2.x},${p2.y})(${p3.x},${p3.y})(${p1.x},${p1.y})`)
				used.add(`(${p3.x},${p3.y})(${p1.x},${p1.y})(${p2.x},${p2.y})`)
				used.add(`(${p3.x},${p3.y})(${p2.x},${p2.y})(${p1.x},${p1.y})`)

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

const drawTetrahedrons = (scene, tetrahedrons) => {
	let colors, positions

	// Soid tetrahedrons

	positions = tetrahedrons.flatMap(([p1, p2, p3, p4]) => [
		p1.x / 10, p1.y / 10, p1.z,
		p2.x / 10, p2.y / 10, p2.z,
		p3.x / 10, p3.y / 10, p3.z,
		p4.x / 10, p4.y / 10, p4.z,
	])

	colors = tetrahedrons.flatMap((t, i) => {
		const green = [0, 0.5, 0, 1]
		const limeGreen = [0.195, 0.801, 0.195, 1]

		return t.flatMap(p => i % 2 == 0 ? green : limeGreen)
	})

	scene.drawTriangles(positions, colors)

	// Outlines

	positions = tetrahedrons.flatMap(([p1, p2, p3, p4]) => [
		p1.x / 10, p1.y / 10, p1.z,
		p2.x / 10, p2.y / 10, p2.z,
		p2.x / 10, p2.y / 10, p2.z,
		p3.x / 10, p3.y / 10, p3.z,
		p3.x / 10, p3.y / 10, p3.z,
		p1.x / 10, p1.y / 10, p1.z,
		p1.x / 10, p1.y / 10, p1.z,
		p2.x / 10, p2.y / 10, p2.z,
		p2.x / 10, p2.y / 10, p2.z,
		p4.x / 10, p4.y / 10, p4.z,
		p4.x / 10, p4.y / 10, p4.z,
		p1.x / 10, p1.y / 10, p1.z,
		p1.x / 10, p1.y / 10, p1.z,
		p3.x / 10, p3.y / 10, p3.z,
		p3.x / 10, p3.y / 10, p3.z,
		p4.x / 10, p4.y / 10, p4.z,
		p4.x / 10, p4.y / 10, p4.z,
		p1.x / 10, p1.y / 10, p1.z,
	])

	colors = Array(positions.length / 3)
		.fill(0)
		.flatMap(c => [0, 0, 0, 1])

	scene.drawLines(positions, colors)
}

const scene = new Scene()
	.rotate(-0.5, -0.5, 0)
	.project(0.9)

const points = Array(10)
	.fill(0)
	.flatMap((_, i) =>
		Array(10)
		.fill(0)
		.flatMap((_, j) => 
			Array(10)
			.fill(0)
			.map((_, k) => ({x: j - 5, y: i - 5, z: k - 5}))
		)
)

const tetrahedrons = createTetrahedrons(points)

drawTetrahedrons(scene, tetrahedrons)
