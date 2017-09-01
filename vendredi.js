window.addEventListener('load', function load(event) {
	let score = 0;
	let food = 3;
	let dayDuration = 1; // in seconds
	let gameon = true;
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
	let $food = document.getElementById('food');
	let $dead = document.getElementById('dead');
	let $finalDays = document.getElementById('final-days');

	let die = function() {
		gameon = false;
		$finalDays.textContent = score;
		$dead.style.display = 'block';
	}
	let updateScore = function() {
		let tens = Math.floor(score/10);
		let units = score % 10;
		$score.textContent = '';
		if (tens > 0) {
			$score.textContent = '55'.repeat(tens);
		}
		if (units > 0) {
			$score.textContent += units;
		}
		$score.textContent = $score.textContent.replace(/.{5}/g, '$&\n');
		if (gameon) {
			score++;
			setTimeout(updateScore, dayDuration * 1000);
		}
	};
	updateScore();
	let updateFood = function() {
		if (food === 0) {
			die();
		}
		$food.textContent = 'b'.repeat(food);
		if (gameon) {
			food--;
			setTimeout(updateFood, dayDuration * 1000);
		}
	}
	updateFood();

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
		if (gameon) {
			window.requestAnimationFrame(render);
		}
	};
	window.requestAnimationFrame(render);
});
