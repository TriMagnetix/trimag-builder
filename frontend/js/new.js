import { $ } from './modules/common.js'
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
			if (p1.x == p2.x && p1.y == p2.y && p1.z == p2.z) return
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

const drawTetrahedrons = (scene, tetrahedrons) => {
	let colors, positions

	// Soid tetrahedrons

	positions = tetrahedrons.flatMap(([p1, p2, p3, p4]) => [
		p1.x, p1.y, p1.z,
		p2.x, p2.y, p2.z,
		p3.x, p3.y, p3.z,
		p1.x, p1.y, p1.z,
		p2.x, p2.y, p2.z,
		p4.x, p4.y, p4.z,
		p1.x, p1.y, p1.z,
		p3.x, p3.y, p3.z,
		p4.x, p4.y, p4.z,
		p2.x, p2.y, p2.z,
		p3.x, p3.y, p3.z,
		p4.x, p4.y, p4.z,
	])

	colors = tetrahedrons.flatMap((t, i) => {
		const green = [0, 0.5, 0, 1]
		const limeGreen = [0.195, 0.801, 0.195, 1]
		const darkGreen = [0, 0.2, 0, 1]
		const lightGreen = [0, 1, 0, 1]

		return t.flatMap(p => Array(3).fill(0)
			.flatMap((_, j) => i % 2 == 0
				? j % 2 && darkGreen || green
				: j % 2 && limeGreen || lightGreen))
	})

	scene.drawTriangles(positions, colors)

	// Outlines

	positions = tetrahedrons.flatMap(([p1, p2, p3, p4]) => [
		p1.x, p1.y, p1.z,
		p2.x, p2.y, p2.z,
		p2.x, p2.y, p2.z,
		p3.x, p3.y, p3.z,
		p3.x, p3.y, p3.z,
		p1.x, p1.y, p1.z,
		p1.x, p1.y, p1.z,
		p2.x, p2.y, p2.z,
		p2.x, p2.y, p2.z,
		p4.x, p4.y, p4.z,
		p4.x, p4.y, p4.z,
		p1.x, p1.y, p1.z,
		p1.x, p1.y, p1.z,
		p3.x, p3.y, p3.z,
		p3.x, p3.y, p3.z,
		p4.x, p4.y, p4.z,
		p4.x, p4.y, p4.z,
		p1.x, p1.y, p1.z,
	])

	colors = Array(positions.length / 3)
		.fill(0)
		.flatMap(c => [0, 0, 0, 1])

	scene.drawLines(positions, colors)
}

const scene = new Scene()
	.project(2, $('canvas').width / $('canvas').height)

const points = Array(10)
	.fill(0)
	.flatMap((_, i) =>
		Array(10)
		.fill(0)
		.flatMap((_, j) => 
			Array(10)
			.fill(0)
			.map((_, k) => ({x: j, y: i, z: k}))
		)
)

const tetrahedrons = createTetrahedrons(points)

drawTetrahedrons(scene, tetrahedrons)

// Tranformation controls

$('main').onmousedown = () => $('main').isClicked = true
$('main').onmouseup = () => $('main').isClicked = false
$('main').onmouseout = () => $('main').isClicked = false

$('main').onmousemove = e => {
	if (!$('main').isClicked) return

	scene.clear()

	// Click and drag to rotate
	!e.shiftKey && scene.rotate(
		Math.PI * e.movementY / 100,
		Math.PI * e.movementX / 100,
		0,
	)

	// Shift-Click and drag to translate
	e.shiftKey && scene.translate(
		4.5 * e.movementX / $('main').clientWidth,
		-4.5 * e.movementY / $('main').clientHeight,
		0,
	)

	drawTetrahedrons(scene, tetrahedrons)
}

// Mouse-wheel to scale
$('main').onwheel = e => {
	scene.clear()
	scene.scale(e.deltaY > 0 ? 1.15 : 0.85)
	drawTetrahedrons(scene, tetrahedrons)
}
