// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
let Perlin = {};

Perlin.gradients = [
	[1, -1, 0],
	[1, 0, -1],
	[0, 1, -1],
	[-1, 1, 0],
	[-1, 0, 1],
	[0, -1, 1]
];
Perlin.extraGradients = [
	[1, -0.5, -0.5],
	[0.5, 0.5, -1],
	[-0.5, 1, -0.5],
	[-1, 0.5, 0.5],
	[-0.5, -0.5, 1],
	[0.5, -1, 0.5]
];
Perlin.gradients = Perlin.gradients.concat(Perlin.extraGradients);

Perlin.generateGradient = function(radius) {
	let index = Math.floor(Perlin.gradients.length * Math.random());
	return Perlin.gradients[index].map((e) => e*radius);
}
