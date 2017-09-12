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
				continentRadius: 8
			}
		}
	];
	let score = {};
	let levelID = 0;
	let gameon = true; // Is the game actually running (if not, then probably Game over)
	let moving = false; // Is Vendredi moving along a path currently
	let movePerSecond = 10; // When moving along a path, move N cells per second

	let atlas = undefined;
	let canvas = document.getElementById('canvas');

	let generateLevel = function() {
		let current = levels[levels.length - 1];
		levels.push({
			fish: current.fish,
			maxFish: current.maxFish,
			fishingProbability: current.fishingProbability,
			meat: current.meat,
			maxMeat: current.maxMeat,
			meatingProbability: current.meatingProbability,
			atlas: {
				size: current.atlas.size,
				meshSize: current.atlas.meshSize,
				islandThreshold: current.atlas.islandThreshold,
				continentRadius: current.atlas.continentRadius + 8
			}
		});
	}

	let loadLevel = function(level) {
		score = {
			days: 0,
			food: {
				fish: {
					number: level.fish,
					ate: 0
				},
				meat: {
					number: level.meat,
					ate: 0
				}
			},
			islands: 0,
			move: 0
		};
		atlas = Atlas(level.atlas);
		atlas.generateAtlas();
		canvas.atlas = atlas;
	};

	let reset = function() {
		document.getElementById('final-score').style.display = 'none';
		for (let element of document.getElementsByClassName('dead')) {
			element.style.display = 'none';
		}
		for (let element of document.getElementsByClassName('alive')) {
			element.style.display = 'none';
		}
		document.getElementById('next').style.display = 'none';
		moving = false;
		gameon = true;
	};

	let renderScore = function() {
		gameon = false;
		document.getElementById('final-days').textContent = score.days;
		document.getElementById('final-islands').textContent = score.islands;
		document.getElementById('final-fish').textContent = score.food.fish.ate;
		document.getElementById('final-meat').textContent = score.food.meat.ate;
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
		document.getElementById('next').style.display = 'inline-block';
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
		if (fished && score.food.fish.number < levels[levelID].maxFish) {
			score.food.fish.number++;
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
			if (meated && score.food.meat.number + meats < levels[levelID].maxMeat) {
				meats++;
			}
		}
		score.food.meat.number += meats;
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
		if (score.food.meat.number > 0) {
			score.food.meat.number--;
			score.food.meat.ate++;
		} else {
			score.food.fish.number--;
			score.food.fish.ate++;
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
		} else if (score.food.fish.number === 0 && score.food.meat.number === 0) {
			die();
			return;
		}
		let time = performance.now();
		if (gameon && path.length > 2) {
			setTimeout(gameLoop, start + 1000 / movePerSecond - time, start + 1000 / movePerSecond, path.slice(1));
		} else {
			moving = false;
		}
	};

	let render = function(time) {
		canvas.draw();
		// Update food
		score.food.fish.number = Math.min(score.food.fish.number, levels[levelID].maxFish);
		score.food.meat.number = Math.min(score.food.meat.number, levels[levelID].maxMeat);
		document.getElementById('fish').textContent = score.food.fish.number;
		document.getElementById('meat').textContent = score.food.meat.number;
		if (score.food.fish.number >= levels[levelID].maxFish) {
			document.getElementById('max-fish').style.display = 'inline-block';
		} else {
			document.getElementById('max-fish').style.display = 'none';
		}
		if (score.food.meat.number >= levels[levelID].maxMeat) {
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
		if (gameon && !moving) {
			moving = true;
			gameLoop(performance.now(), atlas.path);
		}
	});

	document.getElementById('replay').addEventListener('click', (event) => {
		event.stopPropagation();
		loadLevel(levels[levelID]);
		reset();
		window.requestAnimationFrame(render);
	});

	document.getElementById('next').addEventListener('click', (event) => {
		event.stopPropagation();
		if (levelID === levels.length - 1) {
			generateLevel();
			levelID++;
			console.log(levels[levelID]);
		}
		loadLevel(levels[levelID]);
		reset();
		window.requestAnimationFrame(render);
	});

	reset();
	loadLevel(levels[levelID]);
});
