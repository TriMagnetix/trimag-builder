export const mesh = () => {

	/*
	 *	Each element is a vertex with the following schema:
	 *	{
	 *		x: <num>,
	 *		y: <num>,
	 *		neighbors: [<num>, ...]
	 *	}
	 */
	const graph = []

	graph.fromBitmap = bitmap => {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')

		// Initialize binary image to 0
		const binaryImage =
			[...new Array(bitmap.height)].map(() =>
				[...new Array(bitmap.width)].map(() => 0)
			)

		canvas.width = bitmap.width
		canvas.height = bitmap.height

		ctx.drawImage(bitmap, 0, 0)

		// TODO: figure out why the binary image is inverted
		// Convert to binary image 
		ctx.getImageData(0, 0, bitmap.width, bitmap.height).data.forEach((byte, i) => {
			const row = Math.floor(i / (bitmap.width * 4))
			const col = Math.floor(i % (bitmap.width * 4) / 4)

			if (binaryImage[row][col]) return

			binaryImage[row][col] = byte > 0 ? 1 : 0
		})

		// Initialize vertex index-map values to -1 (not a vertex)
		const vertexIndexMap = 
			[...new Array(bitmap.height)].map(() =>
				[...new Array(bitmap.width)].map(() => -1)
			)

		// Assign each black pixel a vertex index
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed
				
				vertexIndexMap[i][j] = graph.length
				graph.push({x: j, y: i, neighbors: []})
			})
		)

		// Connect each vertex to its neighbors
		binaryImage.forEach((row, i) =>
			row.forEach((col, j) => {
				if (!col) return // TODO: invert condition when binary image is fixed

				const vertexIdx = vertexIndexMap[i][j];

				[-1, 0, 1].forEach(di =>
					[-1, 0, 1].forEach(dj => {
						if (di == 0 && dj == 0) return
						if (i + di < 0) return
						if (i + di >= bitmap.height) return
						if (j + dj < 0) return
						if (j + dj >= bitmap.width) return
						if (!binaryImage[i + di][j + dj]) return

						graph[vertexIdx].neighbors.push(vertexIndexMap[i + di][j + dj])
					})
				)
			})
		)

		return graph
	}

	return graph
}
