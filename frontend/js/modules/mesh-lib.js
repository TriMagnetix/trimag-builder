export const mesh = () => {

	/*
	 *	Each element is a vertex with the following schema:
	 *	{
	 *		x: <num>,
	 *		y: <num>,
	 *		z: <num>,
	 *		neighbors: [<num>, ...],
	 *		exterior: <bool>,
	 *	}
	 */
	const graph = []

	graph.fromBitmap = (bitmap, scale=1) => {
		const canvas = document.createElement('canvas')

		canvas.width = bitmap.width * scale
		canvas.height = bitmap.height * scale

		const ctx = canvas.getContext('2d')

		ctx.scale(scale, scale)

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
				graph.push({x: j, y: i, z: 0, neighbors: [], exterior: true})
			})
		)

		// Connect each vertex to its neighbors
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed
				if (i % 2 != j % 2) return

				const vertexIdx = vertexIndexMap[i][j]
				let neighbors = []

				Array(-1, 0, 1).forEach(di => {
					Array(-1, 0, 1).forEach(dj => {
						if (di == dj) return
						if (di == -dj) return
						if (i + di < 0) return
						if (i + di >= canvas.height) return
						if (j + dj < 0) return
						if (j + dj >= canvas.width) return
						if (!binaryImage[i + di][j + dj]) return

						graph[vertexIdx].neighbors.push(vertexIndexMap[i + di][j + dj])
					})
				})
			})
		)

		return graph
	}

	return graph
}

// Convert mesh to Nmag mesh format (PYFEM mesh file v1.0)
// https://nmag.readthedocs.io/en/latest/finite_element_mesh_generation.html#ascii-nmesh
export const mesh2nmesh = mesh => {
	const nmesh = {nodes: [], simplices: new Set(), surfaces: new Set(), periodic: []}

	// Construct nodes
	mesh.forEach(({x, y, z}) => nmesh.nodes.push(
		[x, y, z]
		.join('\t')
	))

	// Construct simplices
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 3) return

		// TODO: add support for different regions
		const region = 1;

		for (let i = 0; i < n.length; i++) {
			for (let j = i + 1; j < n.length; j++) {
				for (let k = j + 1; k < n.length; k++) {
					const simplex = [v, n[i], n[j], n[k]]
					const simplexNodes = simplex.map(nodeIdx => mesh[nodeIdx])

					// Must be 3d to be a simplex
					if (
						simplexNodes.every(node => node.x == x)
						|| simplexNodes.every(node => node.y == y)
						|| simplexNodes.every(node => node.z == z)
					) continue

					nmesh.simplices.add(
						[region, ...simplex.sort()].join('\t')
					)
				}
			}
		}
	})

	// Construct surfaces
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 3) return

		// TODO: add support for different regions
		const region1 = -1
		const region2 = 1

		for (let i = 0; i < n.length; i++) {
			for (let j = i + 1; j < n.length; j++) {
				const surface = [v, n[i], n[j]]
				const surfaceNodes = surface.map(nodeIdx => mesh[nodeIdx])

				// Must be 2d to be a surface
				if (
					[
						surfaceNodes.every(node => node.x == x),
						surfaceNodes.every(node => node.y == y),
						surfaceNodes.every(node => node.z == z),
					]
					.reduce((acc, isConstrainedDim) => acc + isConstrainedDim) != 1
				) continue

				// Must be on the exterior to be a surface
				if (
					!surfaceNodes.every(node => node.exterior)
				) continue

				nmesh.surfaces.add(
					[region1, region2, ...surface.sort()].join('\t')
				)
			}
		}
	})

	// TODO: Support periodic identifications of points

	// Render to text and return
	return [
		'# PYFEM mesh file version 1.0',
		`# dim = 3\tnodes = ${nmesh.nodes.length}\tsimplices = ${nmesh.simplices.size}\tsurfaces = ${nmesh.surfaces.size}\tperiodic = ${nmesh.periodic.length}`,
		nmesh.nodes.length,
		...nmesh.nodes,
		nmesh.simplices.size,
		...nmesh.simplices,
		nmesh.surfaces.size,
		...nmesh.surfaces,
		nmesh.periodic.length,
		...nmesh.periodic,
	].join('\n')
}

// Convert mesh to NGSolve/Netgen neutral mesh format
export const mesh2neutralmesh = mesh => {
	const neutralMesh = {points: [], volumeElements: new Set(), surfaceElements: new Set()}

	// Construct points
	mesh.forEach(({x, y, z}) => neutralMesh.points.push(
		[x, y, z]
		.join('\t')
	))

	// Construct volume elements
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 3) return

		// TODO: add support for different regions
		const region = 1;

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

					neutralMesh.volumeElements.add(
						[region, ...volumeElement.sort().map(idx => idx + 1)].join('\t')
					)
				}
			}
		}
	})

	// Construct surface elements
	mesh.forEach(({x, y, z, neighbors: n}, v) => {
		if (n.length < 3) return

		// TODO: add support for different regions
		const region1 = 1

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

				neutralMesh.surfaceElements.add(
					[region1, ...surfaceElement.sort().map(idx => idx + 1)].join('\t')
				)
			}
		}
	})

	// Render to text and return
	return [
		neutralMesh.points.length,
		...neutralMesh.points,
		neutralMesh.volumeElements.size,
		...neutralMesh.volumeElements,
		neutralMesh.surfaceElements.size,
		...neutralMesh.surfaceElements,
	].join('\n')
}
