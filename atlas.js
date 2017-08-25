let Atlas = function(args) {
	let size = 1;
	let center = Cell({
		coords: [0, 0, 0]
	});
	let cursor = center;
	let path = [];

	if (args) {
		size = args.size;
	}

	let generateAtlas = function() {
		for (let i = 0; i < size; i++) {
			this.onCircle(i).forEach((cell) => cell.createNeighbors());
		}
		// Percentage of islands
		let threshold = 0.995;
		// For each new island, give that much matter to spread around
		let magnitude = 8.0;
		this.onDisk(size).forEach((cell) => {
			cell.potential = Math.random();
			// If the cell is above 'threshold', give it matter to spread
			if (cell.potential > threshold) {
				cell.potential *= magnitude
			};
		});
		center.potential = magnitude;
		let done = false;
		// Spread the matter
		while (!done) {
			done = true;
			this.onDisk(size).forEach((cell) => {
				if (cell.potential > threshold && cell.type !== 'island') {
					cell.type = 'island';
					let diff = cell.potential - threshold;
					let n = [];
					for (let direction of Cell.DIRECTIONS) {
						let c = cell.neighbors[direction];
						if (c && c.type !== 'island') {
							n.push(c);
						}
					}
					n.forEach((c) => {
						done = false;
						c.potential += (diff / n.length);
					});
				}
			});
		}
	};

	let onCircle = function(radius) {
		let circleCells = [];
		let cell = this.center;
		if (radius === 0) {
			return [cell];
		}
		for (let i = 0; i < radius; i++) {
			cell = cell.neighbors.southwest;
		}
		for (let direction of Cell.DIRECTIONS) {
			for (let i = 0; i < radius; i++) {
				circleCells.push(cell);
				cell = cell.neighbors[direction];
			}
		}
		return circleCells;
	};

	let onDisk = function(radius) {
		let cell = this.center;
		let diskCells = [];
		for (let i = 0; i <= radius; i++) {
			this.onCircle(i).forEach((c) => diskCells.push(c));
		}
		return diskCells;
	};

	let findCell = function([tx, ty, tz]) {
		let cell = this.center;
		let [sx, sy, sz] = cell.coords;
		while ((tx - sx !== 0) || (ty - sy !== 0) || (tz - sz !== 0)) {
			let dx = tx - sx;
			let dy = ty - sy;
			let dz = tz - sz;
			if (dx > 0 && dy < 0) {
				cell = cell.neighbors['east'];
			} else if (dx > 0 && dz < 0) {
				cell = cell.neighbors['northeast'];
			} else if (dy > 0 && dz < 0) {
				cell = cell.neighbors['northwest'];
			} else if (dx < 0 && dy > 0) {
				cell = cell.neighbors['west'];
			} else if (dx < 0 && dz > 0) {
				cell = cell.neighbors['southwest'];
			} else if (dy < 0 && dz > 0) {
				cell = cell.neighbors['southeast'];
			}
			[sx, sy, sz] = cell.coords;
		}
		return cell;
	};

	let findCursorCell = function([x, y]) {
		let X = x - y * Math.sqrt(3.0) / 3.0;
		let Z = 2.0 * y / Math.sqrt(3.0);
		let Y = - X - Z;
		let RX = Math.round(X);
		let RY = Math.round(Y);
		let RZ = Math.round(Z);
		let DX = Math.abs(X - RX);
		let DY = Math.abs(Y - RY);
		let DZ = Math.abs(Z - RZ);
		if (DX > DY && DX > DZ) {
			RX = - RY - RZ;
		} else if (DY > DZ) {
			RY = - RX - RZ;
		} else {
			RZ = - RX - RY;
		}
		RX += this.center.coords[0];
		RY += this.center.coords[1];
		RZ += this.center.coords[2];
		return findCell.call(this, [RX, RY, RZ]);
	};

	let findPath = function(coords) {
		let frontier = [{
			cell: this.center,
			priority: 0
		}];
		let cameFrom = {
			[this.center.coords.join(':')]: null
		};
		let path = [];
		while (frontier.length !== 0) {
			let current = frontier.shift().cell;
			if (current.distance(Cell({coords})) === 0) {
				let cell = current;
				while (cell !== null) {
					path.push(cell);
					cell = cameFrom[cell.coords.join(':')];
				}
				path.reverse();
				return path;
			}
			for (let direction of Cell.DIRECTIONS) {
				let next = current.neighbors[direction];
				if (next && Array.isArray(next.coords) && cameFrom[next.coords.join(':')] === undefined) {
					let priority = next.distance(Cell({coords}));
					frontier.push({
						cell: next,
						priority
					});
					cameFrom[next.coords.join(':')] = current;
				}
			}
			frontier.sort((a, b) => a.priority - b.priority);
		}
		return [];
	};

	let move = function(direction) {
		this.onCircle(this.size).forEach((cell) => {
			let index = Cell.DIRECTIONS.indexOf(direction);
			let dir1 = Cell.DIRECTIONS[(index + 2) % 6];
			let dir2 = Cell.DIRECTIONS[(index + 4) % 6];
			if (cell.neighbors[dir1] !== undefined && cell.neighbors[dir2] !== undefined) {
				cell.createNeighbors();
			}
		});
		this.center = this.center.neighbors[direction];
	};

	return {
		size,
		center,
		cursor,
		path,
		generateAtlas,
		onCircle,
		onDisk,
		findCell,
		findCursorCell,
		findPath,
		move
	};
}
