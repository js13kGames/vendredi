let update = () => {
	window.width = window.innerWidth;
	window.height = window.innerHeight;
	let canvas = document.getElementById('canvas');
	canvas.width = window.width;
	canvas.height = window.height;
	canvas.center = {
		x: window.width / 2.0,
		y: window.height / 2.0
	};
	canvas.unit = window.height / (32 * Math.sqrt(3));
};

window.addEventListener('resize', (event) => {
	update();
});

window.addEventListener('load', function load(event) {
	update();
});
