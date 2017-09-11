window.addEventListener('load', function load(event) {
	let score = {
		days: 0, // How many days of survival by Vendredi
		ate: {
			fish: 0,
			meat: 0
		},
		islands: 0,
		move: 0
	}
	let level = {
		id: 1,
		fish: 10, // How many fish Vendredi has
		maxFish: 10, // Maximum fishes that Vendredi can keep
		fishingProbability: 0.1, // 10% chances to fish on any water cell
		meat: 0, // How many meat Vendredi has
		maxMeat: 5, // Maximum meat that Vendredi can keep
		meatingProbability: 0.9, // 10% chances to fish on any water cell
		atlas: {
			size: 16,
			meshSize: 4,
			islandThreshold: 0.8,
			continentRadius: 10
		}
	};
	let dayDuration = 1; // How many seconds last a day in the game
	let gameon = true; // Is the game actually running (if not, then probably Game over)
	let moving = false; // Is Vendredi moving along a path currently
	let movePerSecond = 10; // When moving along a path, move N cells per second
	let atlas = Atlas(level.atlas);
	atlas.generateAtlas();

	let canvas = document.getElementById('canvas');
	canvas.atlas = atlas;

	let $days = document.getElementById('days');
	let $fish = document.getElementById('fish');
	let $meat = document.getElementById('meat');
	let $dead = document.getElementById('dead');
	let $finalDays = document.getElementById('final-days');
	let $finalIslands = document.getElementById('final-islands');
	let $finalFish = document.getElementById('final-fish');
	let $finalMeat = document.getElementById('final-meat');

	let die = function() {
		gameon = false;
		$finalDays.textContent = score.days;
		$finalIslands.textContent = score.islands;
		$finalFish.textContent = score.ate.fish;
		$finalMeat.textContent = score.ate.meat;
		$dead.style.display = 'block';
	}
	let updateDays = function() {
		let tens = Math.floor(score.days/10);
		let units = score.days % 10;
		$days.textContent = '';
		if (tens > 0) {
			$days.textContent = '55'.repeat(tens);
		}
		if (units > 0) {
			$days.textContent += units;
		}
		$days.textContent = $days.textContent.replace(/.{5}/g, '$&\n');
		if (gameon) {
			score.days++;
		}
	};
	updateDays();
	let updateFood = function() {
		if (level.fish === 0 && level.meat === 0) {
			die();
		}
		level.fish = Math.min(level.fish, level.maxFish);
		level.meat = Math.min(level.meat, level.maxMeat);
		$fish.textContent = 'b'.repeat(level.fish);
		$meat.textContent = 'c'.repeat(level.meat);
		if (gameon) {
			if (level.meat > 0) {
				level.meat--;
				score.ate.meat++;
			} else {
				level.fish--;
				score.ate.fish++;
			}
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

	let fishing = function(cell) {
		let fished = Math.random() < level.fishingProbability;
		if (fished && level.fish < level.maxFish) {
			level.fish++;
			canvas.foundFish(cell);
		}
	};
	let exploring = function(cell) {
		let island = atlas.onIsland(cell);
		if (!cell.visited) {
			score.islands++;
		}
		island.forEach((cell) => {
			let meated = Math.random() < level.meatingProbability;
			if (meated && level.meat < level.maxMeat && !cell.visited) {
				level.meat++;
				canvas.foundMeat(cell);
			}
			cell.visited = true;
		});
	}

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
		score.move++;
		if (path[1].type === 'water') {
			fishing(path[1]);
		} else if (path[1].type === 'island') {
			exploring(path[1]);
		}
		let time = performance.now();
		if (path.length > 2) {
			updateDays();
			updateFood();
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

	window.addEventListener('resize', (event) => {
		canvas.draw();
	});
});
