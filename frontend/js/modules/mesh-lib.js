export const mesh = () => {

	/*
	 *	Each element is a vertex with the following schema:
	 *	{
	 *		x: <num>,
	 *		y: <num>,
	 *		z: <num>,
	 *		idx: <num>,
	 *		neighbors: [<num>, ...],
	 *		surroundingNodes: [<num, ...>],
	 *		exterior: <bool>,
	 *	}
	 */
	const graph = []

	graph.fromBitmap = (bitmap) => {
		const canvas = document.createElement('canvas')

		canvas.width = bitmap.width
		canvas.height = bitmap.height

		const ctx = canvas.getContext('2d')

		// Initialize binary image to 0
		const binaryImage =
			[...new Array(canvas.height)].map(() =>
				[...new Array(canvas.width)].map(() => 0)
			)

		ctx.drawImage(bitmap, 0, 0)

		// TODO: figure out why the binary image is inverted
		// Convert to binary image 
		ctx.getImageData(0, 0, canvas.width, canvas.height).data.forEach((byte, i) => {
			const row = Math.floor(i / (canvas.width * 4))
			const col = Math.floor(i % (canvas.width * 4) / 4)

			if (binaryImage[row][col]) return

			binaryImage[row][col] = byte > 0 ? 1 : 0
		})

		// Initialize vertex index-map values to -1 (not a vertex)
		const vertexIndexMap = 
			[...new Array(canvas.height)].map(() =>
				[...new Array(canvas.width)].map(() => -1)
			)

		// Assign each black pixel a vertex index
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed
				
				vertexIndexMap[i][j] = graph.length
				graph.push({x: j, y: i, z: 0, idx: graph.length, neighbors: [], exterior: true})
			})
		)

		// Connect each vertex to its neighbors
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed

				const node = graph[vertexIndexMap[i][j]]

				const neighborMap = {
					topLeft: vertexIndexMap[i - 1]?.[j - 1],
					top: vertexIndexMap[i - 1]?.[j],
					topRight: vertexIndexMap[i - 1]?.[j + 1],
					left: vertexIndexMap[i][j - 1],
					right: vertexIndexMap[i][j + 1],
					bottomLeft: vertexIndexMap[i + 1]?.[j - 1],
					bottom: vertexIndexMap[i + 1]?.[j],
					bottomRight: vertexIndexMap[i + 1]?.[j + 1],
				}

				node.surroundingNodes = Object.values(neighborMap)
					.filter(idx => idx != undefined && idx != -1)

				if (
					node.surroundingNodes.length == 8
					&& i % 2 != j % 2
				) return

				const { topLeft, top, topRight, left, right, bottomLeft, bottom, bottomRight } = neighborMap

				node.neighbors = [
					left,
					right,
					top,
					bottom,
				].filter(idx =>
					idx != undefined
					&& idx != false
					&& idx != -1
				)
			})
		)

		// Remove redundant nodes
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed

				const node = graph[vertexIndexMap[i][j]]

				const neighborMap = {
					topLeft: vertexIndexMap[i - 1]?.[j - 1],
					top: vertexIndexMap[i - 1]?.[j],
					topRight: vertexIndexMap[i - 1]?.[j + 1],
					left: vertexIndexMap[i][j - 1],
					right: vertexIndexMap[i][j + 1],
					bottomLeft: vertexIndexMap[i + 1]?.[j - 1],
					bottom: vertexIndexMap[i + 1]?.[j],
					bottomRight: vertexIndexMap[i + 1]?.[j + 1],
				}

				if (i % 2 == j % 2) return

				const { topLeft, top, topRight, left, right, bottomLeft, bottom, bottomRight } = neighborMap

				const remove = {
					[left]:
						(!graph[top] || graph[left]?.neighbors.includes(topLeft))
						&& (!graph[bottom] || graph[left]?.neighbors.includes(bottomLeft)),
					[right]:
						(!graph[top] || graph[right]?.neighbors.includes(topRight))
						&& (!graph[bottom] || graph[right]?.neighbors.includes(bottomRight)),
					[top]:
						(!graph[left] || graph[top]?.neighbors.includes(topLeft))
						&& (!graph[right] || graph[top]?.neighbors.includes(topRight)),
					[bottom]:
						(!graph[left] || graph[bottom]?.neighbors.includes(bottomLeft))
						&& (!graph[right] || graph[bottom]?.neighbors.includes(bottomRight)),
				}

				node.neighbors = node.neighbors.filter(n => !remove[n])
			})

		)

		return graph
	}

	graph.smooth = () => {
		const maxDist = 7
		const corners = graph.filter(node => node.surroundingNodes.length < 5)
		const sides = graph.filter(node => node.surroundingNodes.length == 5)

		const distance = (n1, n2) => Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2))

		const quadrant = (n1, n2) => {
			const direction = {
				x: n2.x - n1.x,
				y: n2.y - n1.y,
			}

			return direction.x > 0 && direction.y > 0 ? 1
				: direction.x > 0 && direction.y < 0 ? 2
				: direction.x < 0 && direction.y < 0 ? 3
				: 4
		}

		corners.forEach((n1, i) => {
			// Connect to the closest two corners within range

			const expectedConnections = n1.surroundingNodes
				.map(n2 => graph[n2])
				.filter(n2 => n2.surroundingNodes.length == 5)
				.filter(n2 => n1.x == n2.x || n1.y == n2.y)
				.length == 0 ? 2 : 1

			const candidates = corners
				.filter((_, j) => j != i)
				.filter(n2 => distance(n1, n2) <= maxDist)
				.sort((n2, n3) => distance(n1, n2) - distance(n1, n3))
				.filter((n2, j, array) => j == 0 || quadrant(n1, n2) != quadrant(n1, array[0]))
				.filter((_, j) => j < expectedConnections)

			const addNode = neighbors =>
				graph.push({
					x: neighbors[0].x + (neighbors[1].x - neighbors[0].x) / 2,
					y: neighbors[0].y + (neighbors[1].y - neighbors[0].y) / 2,
					z: 0,
					idx: graph.length,
					neighbors: neighbors.map(n => n.idx),
					exterior: true,
				})

			candidates.forEach(n2 => addNode([n1, n2]))

			// If there are not enough corners within range, connect to the furthest side node in range

			if (candidates.length >= expectedConnections) return

			const closest = candidates.length == 1 ? distance(n1, candidates[0]) : maxDist

			sides
				.filter(n2 => distance(n1, n2) <= maxDist)
				.sort((n2, n3) => distance(n1, n3) - distance(n1, n2))
				.filter((n2, j) => candidates.length == 0 || quadrant(n1, n2) != quadrant(n1, candidates[0]))
				.filter((n2, j, array) => j == 0 || quadrant(n1, n2) != quadrant(n1, array[0]))
				.filter((_, j) => j < expectedConnections - candidates.length)
				.forEach(n2 => addNode([n1, n2]))
		})

		return graph
	}

	return graph
}

const _getVolumes = mesh => {
	const result = []

	// Construct volume elements
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 3) return

		for (let i = 0; i < n.length; i++) {
			for (let j = i + 1; j < n.length; j++) {
				for (let k = j + 1; k < n.length; k++) {
					const volumeElement = [v, n[i], n[j], n[k]]
					const volumeElementNodes = volumeElement.map(pointIdx => mesh[pointIdx])

					// Must be 3d to be a volume element
					if (
						volumeElementNodes.every(node => node.x == x)
						|| volumeElementNodes.every(node => node.y == y)
						|| volumeElementNodes.every(node => node.z == z)
					) continue

					result.push(volumeElement)
				}
			}
		}
	})

	return result
}

const _getSurfaces = mesh => {
	const result = []

	// Construct surface elements
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 2) return

		for (let i = 0; i < n.length; i++) {
			for (let j = i + 1; j < n.length; j++) {
				const surfaceElement = [v, n[i], n[j]]
				const surfaceElementNodes = surfaceElement.map(pointIdx => mesh[pointIdx])

				// Must be on the exterior to be a surface element
				if (
					!surfaceElementNodes.every(node => node.exterior)
				) continue

				// Must be 2d to be a surface element
				if (
					[
						surfaceElementNodes.every(node => node.x == x),
						surfaceElementNodes.every(node => node.y == y),
						surfaceElementNodes.every(node => node.z == z),
					]
					.reduce((acc, isConstrainedDim) => acc + isConstrainedDim) != 1
				) continue

				result.push(surfaceElement)
			}
		}
	})

	return result
}

// Convert mesh to Nmag mesh format (PYFEM mesh file v1.0)
// https://nmag.readthedocs.io/en/latest/finite_element_mesh_generation.html#ascii-nmesh
export const mesh2nmesh = mesh => {

	// TODO: add support for different regions
	const region1 = 1
	const region2 = -1

	const nmesh = {
		nodes: mesh.map(({x, y, z}) => [x, y, z].join('\t')),
		simplices: _getVolumes(mesh).map(
			v => [region1, ...v].join('\t')
		),
		surfaces: _getSurfaces(mesh).map(
			s => [region1, region2, ...s].join('\t')
		),
		periodic: [],
	}

	// Render to text and return
	return [
		'# PYFEM mesh file version 1.0',
		`# dim = 3\tnodes = ${nmesh.nodes.length}\tsimplices = ${nmesh.simplices.length}\tsurfaces = ${nmesh.surfaces.length}\tperiodic = ${nmesh.periodic.length}`,
		nmesh.nodes.length,
		...nmesh.nodes,
		nmesh.simplices.length,
		...nmesh.simplices,
		nmesh.surfaces.length,
		...nmesh.surfaces,
		nmesh.periodic.length,
		...nmesh.periodic,
	].join('\n')
}

// Convert mesh to NGSolve/Netgen neutral mesh format
export const mesh2neutralmesh = mesh => {

	// TODO: add support for different regions
	const region = 1;

	const neutralMesh = {
		points: mesh.map(
			({x, y, z}) => [x, y, z].join('\t')
		),
		volumeElements: _getVolumes(mesh).map(
			v => [region, ...v.map(idx => idx + 1)].join('\t')
		),
		surfaceElements: _getSurfaces(mesh).map(
			s => [region, ...s.map(idx => idx + 1)].join('\t')
		)
	}

	// Render to text and return
	return [
		neutralMesh.points.length,
		...neutralMesh.points,
		neutralMesh.volumeElements.length,
		...neutralMesh.volumeElements,
		neutralMesh.surfaceElements.length,
		...neutralMesh.surfaceElements,
	].join('\n')
}
