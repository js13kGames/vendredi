window.addEventListener('load', function load(event) {
	let levels = [
		{
			fish: 5, // How many fish Vendredi has
			maxFish: 5, // Maximum fishes that Vendredi can keep
			fishingProbability: 0.5, // 50% chances to fish on any water cell
			meat: 0, // How many meat Vendredi has
			maxMeat: 5, // Maximum meat that Vendredi can keep
			meatingProbability: 0.9, // 10% chances to fish on any water cell
			atlas: {
				size: 16,
				meshSize: 4,
				islandThreshold: 0.8,
				continentRadius: 10
			}
		}
	];
	let score = {
		days: 0, // How many days of survival by Vendredi
		ate: {
			fish: 0,
			meat: 0
		},
		islands: 0,
		move: 0
	};
	let levelID = 0;
	let gameon = true; // Is the game actually running (if not, then probably Game over)
	let moving = false; // Is Vendredi moving along a path currently
	let movePerSecond = 10; // When moving along a path, move N cells per second

	let atlas = Atlas(levels[levelID].atlas);
	atlas.generateAtlas();

	let canvas = document.getElementById('canvas');
	canvas.atlas = atlas;

	let renderScore = function() {
		gameon = false;
		document.getElementById('final-days').textContent = score.days;
		document.getElementById('final-islands').textContent = score.islands;
		document.getElementById('final-fish').textContent = score.ate.fish;
		document.getElementById('final-meat').textContent = score.ate.meat;
		document.getElementById('final-score').style.display = 'block';
	};

	let die = function() {
		for (let element of document.getElementsByClassName('dead')) {
			element.style.display = 'inline-block';
		};
		renderScore();
	};

	let saved = function() {
		for (let element of document.getElementsByClassName('alive')) {
			element.style.display = 'inline-block';
		};
		renderScore();
	}

	let updatePath = function(mousex, mousey) {
		let x = (mousex - canvas.center.x) / canvas.unit;
		let y = (mousey - canvas.center.y) / canvas.unit;
		atlas.cursor = atlas.findCursorCell([x, y]);
		atlas.path = atlas.findPath(atlas.cursor.coords);
	};

	let fishing = function(cell) {
		let fished = Math.random() < levels[levelID].fishingProbability;
		if (fished && levels[levelID].fish < levels[levelID].maxFish) {
			levels[levelID].fish++;
			canvas.foundFish(cell);
		}
	};

	let exploring = function(cell) {
		let island = atlas.onIsland(cell);
		if (!cell.visited) {
			score.islands++;
			island.forEach((cell) => {
				cell.visited = true;
			});
		}
		let meats = 0;
		for (let i = 0; i < levels[levelID].maxMeat; i++) {
			let meated = Math.random() < levels[levelID].meatingProbability;
			if (meated && levels[levelID].meat + meats < levels[levelID].maxMeat) {
				meats++;
			}
		}
		levels[levelID].meat += meats;
		canvas.foundMeat(cell, meats);
	};

	let move = function(first, second) {
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
	};

	let update = function() {
		// Update days
		score.days++;
		// Update food
		if (levels[levelID].meat > 0) {
			levels[levelID].meat--;
			score.ate.meat++;
		} else {
			levels[levelID].fish--;
			score.ate.fish++;
		}
	};

	let gameLoop = function(start, path) {
		let first = path[0];
		let second = path[1];
		if (atlas.path.length >= 2) {
			move(first, second);
			update();
		}
		if (second.type === 'island') {
			exploring(second);
		} else if (second.type === 'water') {
			fishing(second);
		}
		if (second.type === 'continent') {
			saved();
			return;
		} else if (levels[levelID].fish === 0 && levels[levelID].meat === 0) {
			die();
			return;
		}
		let time = performance.now();
		if (path.length > 2) {
			setTimeout(gameLoop, start + 1000 / movePerSecond - time, start + 1000 / movePerSecond, path.slice(1));
		} else {
			moving = false;
		}
	};

	let render = function(time) {
		canvas.draw();
		// Update food
		levels[levelID].fish = Math.min(levels[levelID].fish, levels[levelID].maxFish);
		levels[levelID].meat = Math.min(levels[levelID].meat, levels[levelID].maxMeat);
		document.getElementById('fish').textContent = levels[levelID].fish;
		document.getElementById('meat').textContent = levels[levelID].meat;
		if (levels[levelID].fish >= levels[levelID].maxFish) {
			document.getElementById('max-fish').style.display = 'inline-block';
		} else {
			document.getElementById('max-fish').style.display = 'none';
		}
		if (levels[levelID].meat >= levels[levelID].maxMeat) {
			document.getElementById('max-meat').style.display = 'inline-block';
		} else {
			document.getElementById('max-meat').style.display = 'none';
		}
		if (gameon) {
			window.requestAnimationFrame(render);
		}
	};

	window.requestAnimationFrame(render);

	window.addEventListener('resize', (event) => {
		canvas.draw();
	});

	window.addEventListener('mousemove', (event) => {
		if (!moving) {
			updatePath(event.clientX, event.clientY);
		}
	});

	window.addEventListener('click', (event) => {
		if (!moving) {
			moving = true;
			gameLoop(performance.now(), atlas.path);
		}
	});
});
