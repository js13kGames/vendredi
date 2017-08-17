window.addEventListener('load', function load(event) {
	let canvas = document.getElementById('canvas');
	let ctx = canvas.getContext('2d');

	let start = Date.now();
	let center = Cell({
		coords: [0, 0, 0]
	});
	let mapSize = 32;
	for (let i = 0; i < mapSize; i++) {
		center.onCircle(i).forEach((c) => c.createNeighbors());
	}
	let generated = Date.now();
	console.log(`Generation done in ${generated - start}ms`);

	ctx.fillStyle = 'gray';
	ctx.strokeStyle = 'gray';
	ctx.beginPath();
	for (let i = 0; i < mapSize; i++) {
		center.onCircle(i).forEach((c) => {
			let coords = c.pixelCoords();
			let x = canvas.center.x + coords[0]*canvas.unit;
			let y = canvas.center.y + coords[1]*canvas.unit;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.arc(x, y, canvas.unit/2.0, 0, 2*Math.PI);
			ctx.fill();
			ctx.closePath();
		});
	}
	let drawn = Date.now();
	console.log(`Drawing done in ${drawn - generated}ms`);
});
