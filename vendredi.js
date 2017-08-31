window.addEventListener('load', function load(event) {
	let score = 0;
	let dayDuration = 1; // in seconds
	let moving = false;
	let movePerSecond = 10;
	let atlas = Atlas({
		size: 32,
		meshSize: 4
	});
	atlas.generateAtlas();

	let canvas = document.getElementById('canvas');
	canvas.atlas = atlas;

	let $score = document.getElementById('score');
	let updateScore = function() {
		score += 1;
		$score.textContent = '' + score;
		setTimeout(updateScore, dayDuration * 1000);
	};
	updateScore();

	let updatePath = function(mousex, mousey) {
		let x = (mousex - canvas.center.x) / canvas.unit;
		let y = (mousey - canvas.center.y) / canvas.unit;
		atlas.cursor = atlas.findCursorCell([x, y]);
		atlas.path = atlas.findPath(atlas.cursor.coords);
	};
	window.addEventListener('mousemove', (event) => {
		if (!moving) {
			updatePath(event.clientX, event.clientY);
		}
	});

	let moveOnPath = function(start, path) {
		let direction = 'east';
		let first = path[0];
		let second = path[1];
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
		let time = performance.now();
		if (path.length > 2) {
			setTimeout(moveOnPath, start + 1000 / movePerSecond - time, start + 1000 / movePerSecond, path.slice(1));
		} else {
			moving = false;
		}
	};

	window.addEventListener('click', (event) => {
		if (!moving) {
			moving = true;
			moveOnPath(performance.now(), atlas.path);
		}
	})

	let render = function(time) {
		canvas.draw();
		window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);
});
