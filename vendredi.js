window.addEventListener('load', function load(event) {
	let atlas = Atlas({
		size: 32
	})
	atlas.generateAtlas();
	atlas.center.onCircle(1).forEach((cell) => {
		cell.type = 'island';
	});

	let canvas = document.getElementById('canvas');
	canvas.atlas = atlas;

	window.addEventListener('mousemove', (event) => {
		let x = (event.clientX - canvas.center.x) / canvas.unit;
		let y = (event.clientY - canvas.center.y) / canvas.unit;
		atlas.cursor = atlas.findCursorCell([x, y]);
		atlas.path = atlas.findPath(atlas.cursor);
	});

	let render = function(time) {
		canvas.draw();
		window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);
});
