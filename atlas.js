let Atlas = function(args) {
	let size = 1;
	let meshSize = 2;
	let center = Cell({
		coords: [0, 0, 0]
	});
	let cursor = center;
	let path = [];

	if (args) {
		size = args.size;
		meshSize = args.meshSize;
	}

	let generateGradients = function() {
		this.onMesh().forEach((cell) => {
			cell.gradient = Perlin.generateGradient();
		});
	};

	let generateIslands = function() {
		this.onDisk(this.size).forEach((cell) => {
			let corners = [];
			for (let c of cell.onDisk(this.meshSize)) {
				let [x, y, z] = c.coords;
				if ((Math.abs(x) % this.meshSize === 0) && (Math.abs(y) % this.meshSize === 0) && (Math.abs(z) % this.meshSize === 0)) {
					corners.push(c);
				}
				if (corners.length >= 3) {
					break;
				}
			};
			let d1 = cell.coords.map((n, i) => n - corners[0].coords[i]);
			let d2 = cell.coords.map((n, i) => n - corners[1].coords[i]);
			let d3 = cell.coords.map((n, i) => n - corners[2].coords[i]);
			let n1 = Math.sqrt(d1.reduce((s, n) => s + n*n, 0));
			let n2 = Math.sqrt(d2.reduce((s, n) => s + n*n, 0));
			let n3 = Math.sqrt(d3.reduce((s, n) => s + n*n, 0));
			d1 = n1 > 0 ? d1.map((v) => v / n1) : d1;
			d2 = n2 > 0 ? d2.map((v) => v / n2) : d2;
			d3 = n3 > 0 ? d3.map((v) => v / n3) : d3;
			let elevation1 = corners[0].gradient.map((n, i) => n * d1[i]).reduce((s, n) => s + n, 0);
			let elevation2 = corners[1].gradient.map((n, i) => n * d2[i]).reduce((s, n) => s + n, 0);
			let elevation3 = corners[2].gradient.map((n, i) => n * d3[i]).reduce((s, n) => s + n, 0);
			elevation1 = 6.0 * Math.pow(elevation1, 5) - 15.0 * Math.pow(elevation1, 4) + 10.0 * Math.pow(elevation1, 3);
			elevation2 = 6.0 * Math.pow(elevation2, 5) - 15.0 * Math.pow(elevation2, 4) + 10.0 * Math.pow(elevation2, 3);
			elevation3 = 6.0 * Math.pow(elevation3, 5) - 15.0 * Math.pow(elevation3, 4) + 10.0 * Math.pow(elevation3, 3);
			let w1 = this.meshSize - cell.distanceCells(corners[0]);
			let w2 = this.meshSize - cell.distanceCells(corners[1]);
			let w3 = this.meshSize - cell.distanceCells(corners[2]);
			cell.elevation = (w1 * elevation1 + w2 * elevation2 + w3 * elevation3) / this.meshSize;
			if (cell.elevation > 0.8) {
				cell.type = 'island';
			}
		});
	};

	let generateAtlas = function() {
		for (let i = 0; i < this.size + this.meshSize; i++) {
			this.onCircle(i).forEach((cell) => cell.createNeighbors());
		}
		generateGradients.call(this);
		generateIslands.call(this)
	};

	let onCircle = function(radius) {
		return this.center.onCircle(radius);
	};

	let onDisk = function(radius) {
		return this.center.onDisk(radius);
	};

	let onMesh = function() {
		let meshCells = [];
		this.onDisk(this.size + this.meshSize).forEach((cell) => {
			let [x, y, z] = cell.coords;
			if ((Math.abs(x) % this.meshSize === 0) && (Math.abs(y) % this.meshSize === 0) && (Math.abs(z) % this.meshSize === 0)) {
				meshCells.push(cell);
			}
		});
		return meshCells;
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
		meshSize,
		center,
		cursor,
		path,
		generateAtlas,
		onCircle,
		onDisk,
		onMesh,
		findCell,
		findCursorCell,
		findPath,
		move
	};
}
