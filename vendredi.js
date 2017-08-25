window.addEventListener('load', function load(event) {
	let atlas = Atlas({
		size: 32
	});
	atlas.generateAtlas();

	let canvas = document.getElementById('canvas');
	canvas.atlas = atlas;

	window.addEventListener('mousemove', (event) => {
		let x = (event.clientX - canvas.center.x) / canvas.unit;
		let y = (event.clientY - canvas.center.y) / canvas.unit;
		atlas.cursor = atlas.findCursorCell([x, y]);
		atlas.path = atlas.findPath(atlas.cursor.coords);
	});
	window.addEventListener('mousedown', (event) => {
		let x = (event.clientX - canvas.center.x) / canvas.unit;
		let y = (event.clientY - canvas.center.y) / canvas.unit;
		let direction = 'east';
		let first = atlas.path[0];
		let second = atlas.path[1];
		let dx = second.coords[0] - first.coords[0];
		let dy = second.coords[1] - first.coords[1];
		let dz = second.coords[2] - first.coords[2];
		if (dx > 0 && dy < 0 && dz === 0) {
			atlas.move('east');
		} else if (dx > 0 && dy === 0 && dz < 0) {
			atlas.move('northeast');
		} else if (dx === 0 && dy > 0 && dz < 0) {
			atlas.move('northwest');
		} else if (dx < 0 && dy > 0 && dz === 0) {
			atlas.move('west');
		} else if (dx < 0 && dy === 0 && dz > 0) {
			atlas.move('southwest');
		} else if (dx === 0 && dy < 0 && dz > 0) {
			atlas.move('southeast');
		}
		atlas.cursor = atlas.findCursorCell([x, y]);
		atlas.path = atlas.findPath(atlas.cursor.coords);
	})

	let render = function(time) {
		canvas.draw();
		window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);
});
