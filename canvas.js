let Canvas = function(args) {
	let reset = function() {
		this.context.fillStyle = Canvas.COLORS.background;
		this.context.fillRect(0, 0, this.width, this.height);
	};

	let convertCoords = function([sx, sy]) {
		let [cx, cy] = this.atlas.center.pixelCoords();
		return [
			this.center.x + (sx - cx) * this.unit,
			this.center.y + (sy - cy) * this.unit
		]
	}

	let drawCircle = function(color) {
		return function(cell) {
			let [x, y] = convertCoords.call(this, cell.pixelCoords());
			this.context.fillStyle = color;
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.context.arc(x, y, canvas.unit/2.0, 0, 2*Math.PI);
			this.context.fill();
			this.context.closePath();
		};
	};
	let drawWater = drawCircle(Canvas.COLORS.water);
	let drawVendredi = drawCircle(Canvas.COLORS.vendredi);
	let drawCursor = drawCircle(Canvas.COLORS.cursor);
	let drawPathStep = drawCircle(Canvas.COLORS.path);

	let drawIsland = function(cell) {
		let east = cell.neighbors['east'];
		let northeast = cell.neighbors['northeast'];
		let southeast = cell.neighbors['southeast'];
		let [x, y] = convertCoords.call(this, cell.pixelCoords());
		if (east && east.type === 'island') {
			let [nx, ny] = convertCoords.call(this, east.pixelCoords());
			this.context.fillStyle = Canvas.COLORS.island;
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.context.arc(x, y, canvas.unit/2.0, Math.PI/2.0, -Math.PI/2.0);
			this.context.arc(nx, ny, canvas.unit/2.0, -Math.PI/2.0, Math.PI/2.0);
			this.context.arc(x, y, canvas.unit/2.0, Math.PI/2.0, -Math.PI/2.0);
			this.context.fill();
			this.context.closePath();
		}
		if (northeast && northeast.type === 'island') {
			let [nx, ny] = convertCoords.call(this, northeast.pixelCoords());
			this.context.fillStyle = Canvas.COLORS.island;
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.context.arc(x, y, canvas.unit/2.0, Math.PI/6.0, -5.0*Math.PI/6.0);
			this.context.arc(nx, ny, canvas.unit/2.0, -5.0*Math.PI/6.0, Math.PI/6.0);
			this.context.arc(x, y, canvas.unit/2.0, Math.PI/6.0, -5.0*Math.PI/6.0);
			this.context.fill();
			this.context.closePath();
		}
		if (southeast && southeast.type === 'island') {
			let [nx, ny] = convertCoords.call(this, southeast.pixelCoords());
			this.context.fillStyle = Canvas.COLORS.island;
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.context.arc(x, y, canvas.unit/2.0, 5.0*Math.PI/6.0, -Math.PI/6.0);
			this.context.arc(nx, ny, canvas.unit/2.0, -Math.PI/6.0, 5.0*Math.PI/6.0);
			this.context.arc(x, y, canvas.unit/2.0, 5.0*Math.PI/6.0, -Math.PI/6.0);
			this.context.fill();
			this.context.closePath();
		} else {
			drawCircle.call(this, Canvas.COLORS.island).call(this, cell);
		}
	};

	let drawPath = function(path) {
		path.forEach((cell) => {
			drawPathStep.call(this, cell);
		});
	}

	let drawEdges = function() {
		let ccoords = this.atlas.center.pixelCoords();
		this.atlas.onDisk(this.atlas.size).forEach((cell) => {
			let scoords = cell.pixelCoords();
			for (let direction of Cell.DIRECTIONS.slice(0, 3)) {
				let target = cell.neighbors[direction];
				if (target) {
					let tcoords = target.pixelCoords();
					this.context.strokeStyle = 'black';
					this.context.beginPath();
					let sx = canvas.center.x + (scoords[0] - ccoords[0]) * canvas.unit;
					let sy = canvas.center.y + (scoords[1] - ccoords[1]) * canvas.unit;
					this.context.moveTo(sx, sy);
					let tx = canvas.center.x + (tcoords[0] - ccoords[0]) * canvas.unit;
					let ty = canvas.center.y + (tcoords[1] - ccoords[1]) * canvas.unit;
					this.context.lineTo(tx, ty);
					this.context.stroke();
					this.context.closePath();
				}
			}
		});
	}

	let drawMesh = function() {
		this.atlas.onMesh(this.atlas.meshSize).forEach((cell) => {
			let [x, y] = convertCoords.call(this, cell.pixelCoords());
			this.context.fillStyle = 'black';
			this.context.beginPath();
			this.context.arc(x, y, 0.1 * this.unit, 0, 2*Math.PI);
			this.context.fill();
			this.context.closePath();
		});
	};

	let draw = function() {
		this.reset();
		this.atlas.onDisk(this.atlas.size).forEach((cell) => {
			if (cell.type === 'island') {
				drawIsland.call(this, cell);
			}
		});
		this.atlas.onDisk(this.atlas.size).forEach((cell) => {
			if (cell.type === 'water') {
				drawWater.call(this, cell);
			}
		});
		drawPath.call(this, this.atlas.path)
		drawCursor.call(this, this.atlas.cursor);
		drawVendredi.call(this, this.atlas.center);
	};

	return {
		reset,
		draw
	};
};
Canvas.COLORS = {
	"background": 'rgb(240, 240, 240)',
	"water": 'rgb(224, 224, 237)',
	"island": 'rgb(128, 237, 128)',
	"vendredi": 'rgb(186, 0, 0)',
	"cursor": 'rgb(186, 128, 128)',
	"path": 'rgb(192, 192, 237)'
};


window.addEventListener('load', () => {
	let canvas = document.getElementById('canvas');
	let context = canvas.getContext('2d');
	Object.assign(canvas, {context}, Canvas());
});
