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

	let drawCircle = function(color, size = 1.0) {
		return function(cell) {
			let [x, y] = convertCoords.call(this, cell.pixelCoords());
			this.context.save();
			this.context.fillStyle = color;
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.context.arc(x, y, size * canvas.unit/2.0, 0, 2*Math.PI);
			this.context.fill();
			this.context.closePath();
			this.context.restore();
		};
	};
	let drawWater = drawCircle(Canvas.COLORS.water);
	let drawVendredi = drawCircle(Canvas.COLORS.vendredi, 0.75);
	let drawCursor = drawCircle(Canvas.COLORS.cursor, 0.5);
	let drawPathStep = drawCircle(Canvas.COLORS.path, 0.5);

	let drawEarth = function(cell, color) {
		for (let direction of Cell.DIRECTIONS) {
			let index = Cell.DIRECTIONS.findIndex((d) => d === direction);
			let n = cell.neighbors[direction];
			let [x, y] = convertCoords.call(this, cell.pixelCoords());
			this.context.save();
			this.context.fillStyle = color;
			if (n && n.type !== 'water') {
				let [nx, ny] = convertCoords.call(this, n.pixelCoords());
				let pre = ((6 - index) % 6) * 2;
				let angle1 = (pre + 3) * Math.PI / 6.0;
				let angle2 = (pre - 3) * Math.PI / 6.0;
				this.context.beginPath();
				this.context.moveTo(x, y);
				this.context.arc(x, y, canvas.unit/2.0, angle1, angle2);
				this.context.arc(nx, ny, canvas.unit/2.0, angle2, angle1);
				this.context.arc(x, y, canvas.unit/2.0, angle1, angle2);
				this.context.fill();
				this.context.closePath();
			} else {
				drawCircle.call(this, this.context.fillStyle).call(this, cell);
			}
		}
	};

	let drawPath = function(path) {
		path.forEach((cell) => {
			drawPathStep.call(this, cell);
		});
		this.context.save();
		this.context.fillStyle = 'white';
		this.context.globalAlpha = '0.67';
		this.context.font = `128px Flood`;
		this.context.textAlign = 'center';
		this.context.textBaseline = 'middle';
		this.context.fillText(`${Math.max(0, path.length - 1)}`, this.center.x, this.center.y);
		this.context.restore();
	}

	let drawEdges = function() {
		let ccoords = this.atlas.center.pixelCoords();
		this.atlas.onDisk(this.atlas.size).forEach((cell) => {
			let scoords = cell.pixelCoords();
			for (let direction of Cell.DIRECTIONS.slice(0, 3)) {
				let target = cell.neighbors[direction];
				if (target) {
					let tcoords = target.pixelCoords();
					this.context.save();
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
					this.context.restore();
				}
			}
		});
	}

	let drawMesh = function() {
		this.atlas.onMesh().forEach((cell) => {
			let [x, y] = convertCoords.call(this, cell.pixelCoords());
			this.context.save();
			this.context.fillStyle = 'black';
			this.context.beginPath();
			this.context.arc(x, y, 0.1 * this.unit, 0, 2*Math.PI);
			this.context.fill();
			this.context.closePath();
			this.context.restore();
		});
	};

	let drawGradients = function(magnitude) {
		magnitude = magnitude || 1.0;
		this.atlas.onMesh().forEach((cell) => {
			let target = Cell({
				coords: cell.coords.map((n, i) => n + cell.gradient[i] * Math.sqrt(2.0) * magnitude * this.atlas.meshSize),
			});
			let [sx, sy] = convertCoords.call(this, cell.pixelCoords());
			let [tx, ty] = convertCoords.call(this, target.pixelCoords())
			this.context.save();
			this.context.strokeStyle = 'gray';
			this.context.beginPath();
			this.context.moveTo(sx, sy);
			this.context.lineTo(tx, ty);
			this.context.stroke();
			this.context.closePath();
			this.context.restore();
		});
	};

	let drawElevation = function(text) {
		this.atlas.onDisk(this.atlas.size).forEach((cell) => {
			let gray = ( 1.0 - cell.elevation ) * 255;
			let color = `rgb(${gray}, 237, ${gray})`;
			drawCircle.call(this, color).call(this, cell);
			if (text) {
				this.context.save();
				this.context.fillStyle = 'black';
				this.context.textAlign = 'center';
				this.context.textBaseline = 'middle';
				let [x, y] = convertCoords.call(this, cell.pixelCoords());
				let elevation = Math.round(cell.elevation * 10.0);
				this.context.fillText(elevation, x, y);
				this.context.restore();
			}
		});
	};

	let drawDebug = function() {
		drawElevation.call(this);
		drawGradients.call(this, 0.45);
		drawMesh.call(this);
	};
	
	let drawAnimations = function() {
		let animationTime = 1; // Time of the animation in seconds
		let animationMove = 3 * this.unit;
		if (!this.animations) this.animations = [];
		// Remove all finished animations
		this.animations = this.animations.filter((animation) => performance.now() - animation.start < animationTime * 1000);
		this.animations.forEach((animation) => {
			let ratio = (performance.now() - animation.start) / (animationTime * 1000);
			let size = Math.floor(32 * (1 - ratio));
			let [x, y] = convertCoords.call(this, animation.cell.pixelCoords());
			x += ratio * animationMove;
			y -= ratio * animationMove;
			this.context.save();
			this.context.globalAlpha = 1 - ratio * ratio;
			this.context.fillStyle = 'white';
			this.context.strokeStyle = 'black';
			this.context.lineWidth = '2';
			this.context.beginPath();
			this.context.arc(x, y, this.unit * (1 - ratio), 0, 2.0*Math.PI);
			this.context.fill();
			this.context.stroke();
			this.context.closePath();
			this.context.restore();
			this.context.save();
			let symbol = '';
			if (animation.type === 'fish') {
				symbol = 'b';
				this.context.fillStyle = 'rgb(64, 64, 237)';
			} else if (animation.type === 'meat') {
				symbol = 'c';
				this.context.fillStyle = 'rgb(237, 32, 32)';
			}
			this.context.strokeStyle = 'black';
			this.context.lineWidth = '1';
			this.context.globalAlpha = 1 - ratio * ratio;
			this.context.textAlign = 'center';
			this.context.textBaseline = 'middle';
			this.context.font = `${size}px Flood`;
			this.context.fillText(symbol, x, y);
			this.context.restore();
		});
	}

	let draw = function() {
		this.reset();
		this.atlas.onDisk(this.atlas.size - 1).forEach((cell) => {
			if (cell.type === 'island') {
				drawEarth.call(this, cell, cell.visited ? Canvas.COLORS.visited : Canvas.COLORS.island);
			}
			if (cell.type === 'continent') {
				drawEarth.call(this, cell, Canvas.COLORS.continent);
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
		drawAnimations.call(this);
	};

	let foundFish = function(cell) {
		this.animations.push({
			type: 'fish',
			cell,
			start: performance.now()
		});
	};
	let foundMeat = function(cell) {
		this.animations.push({
			type: 'meat',
			cell,
			start: performance.now()
		});
	};

	return {
		reset,
		draw,
		foundFish,
		foundMeat
	};
};
Canvas.COLORS = {
	"background": 'rgb(240, 240, 240)',
	"water": 'rgb(224, 224, 237)',
	"island": 'rgb(128, 237, 128)',
	"visited": 'rgb(16, 64, 16)',
	"sand": 'rgb(237, 237, 128)',
	"continent": 'rgb(128, 64, 0)',
	"vendredi": 'rgb(186, 0, 0)',
	"cursor": 'rgb(186, 128, 128)',
	"path": 'rgb(192, 192, 237)'
};

window.addEventListener('load', () => {
	let canvas = document.getElementById('canvas');
	let context = canvas.getContext('2d');
	Object.assign(canvas, {context}, Canvas());
});
