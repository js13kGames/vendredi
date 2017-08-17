let Cell = function(args) {
	let coords = [];
	let neighbors = {};
	let DIRECTIONS = ['east', 'northeast', 'northwest', 'west', 'southwest', 'southeast'];

	if (args) {
		coords = args.coords;
		Object.assign(neighbors, args.neighbors);
	}

	let offsetDirectionFunction = function(offset) {
		return function(direction) {
			let index = DIRECTIONS.findIndex((e) => e === direction);
			if (index !== -1) {
				return DIRECTIONS[(index + offset) % 6];
			} else {
				throw new Error(`reverseDirection: '${direction}' is not a valid direction.`)
			}
		};
	}
	let reverseDirection = offsetDirectionFunction(3);
	let nextDirection = offsetDirectionFunction(1);
	let previousDirection = offsetDirectionFunction(5); // Do not use '-1' because '-1 % 6 === -1'

	let neighborCoords = function(direction) {
		if (direction === 'east') {
			return [coords[0]+1, coords[1]-1, coords[2]];
		} else if (direction === 'northeast') {
			return [coords[0]+1, coords[1], coords[2]-1];
		} else if (direction === 'northwest') {
			return [coords[0], coords[1]+1, coords[2]-1];
		} else if (direction === 'west') {
			return [coords[0]-1, coords[1]+1, coords[2]];
		} else if (direction === 'southwest') {
			return [coords[0]-1, coords[1], coords[2]+1];
		} else if (direction === 'southeast') {
			return [coords[0], coords[1]-1, coords[2]+1];
		}
	};

	let createNeighbors = function() {
		for (let direction of DIRECTIONS) {
			if (neighbors[direction] === undefined) {
				neighbors[direction] = Cell({
					coords: neighborCoords(direction)
				});
			}
		}
		for (let direction of DIRECTIONS) {
			// Create the link back from the neighbor to the current cell
			let reverse = reverseDirection(direction);
			neighbors[direction].neighbors[reverse] = this;
			// And link also the 2 neighbors of the current cell that touch the 'direction' neighbor
			let next = nextDirection(direction);
			neighbors[direction].neighbors[previousDirection(reverse)] = neighbors[next];
			let previous = previousDirection(direction);
			neighbors[direction].neighbors[nextDirection(reverse)] = neighbors[previous];
		}
	};
	let onCircle = function(radius) {
		let circleCells = [];
		let cell = this;
		if (radius === 0) {
			return [this];
		}
		for (let i = 0; i < radius; i++) {
			cell = cell.neighbors.southwest;
		}
		for (let direction of DIRECTIONS) {
			for (let i = 0; i < radius; i++) {
				circleCells.push(cell);
				cell = cell.neighbors[direction];
			}
		}
		return circleCells;
	};
	let pixelCoords = function() {
		let x = this.coords[0] + this.coords[2] / 2.0;
		let y = Math.sqrt(3.0) * this.coords[2] / 2.0;
		return [x, y];
	}

	return {
		coords,
		neighbors,
		reverseDirection,
		nextDirection,
		previousDirection,
		createNeighbors,
		onCircle,
		pixelCoords
	};
};
