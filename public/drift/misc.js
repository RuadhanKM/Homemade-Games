function vectorDotProduct(pt1, pt2)
{
	return (pt1.x * pt2.x) + (pt1.y * pt2.y)
}

function mag(vec) {
	if (vec.x == 0 && vec.y == 0) {
		return 0
	}
	return Math.sqrt((vec.x ** 2) + (vec.y ** 2))
}

function rad(a) {
	return a * (Math.PI/180)
}
function deg(a) {
	return a * (180/Math.PI)
}

function unit(vec) {
	let magnitude = mag(vec)
	if (magnitude != 0)
	{
		vec.x /= magnitude
		vec.y /= magnitude
	}
	
	return vec
}

function addv(a, b){
	return {'x': a.x + b.x, 'y': a.y + b.y}
}
function subv(a, b){
	return {'x': a.x - b.x, 'y': a.y - b.y}
}
function multv(a, b){
	return {'x': a.x * b.x, 'y': a.y * b.y}
}
function mults(a, b){
	return {'x': a.x * b, 'y': a.y * b}
}
function divs(a, b){
	if (a.x == 0 && a.y == 0) {return a}
	return {'x': a.x / b, 'y': a.y / b}
}

function project(axis, poly) {
	let min = vectorDotProduct(axis, poly.verts[0])
	let max = min
	for (var i = 1; i < poly.verts.length; i++) {
		let p = vectorDotProduct(axis, poly.verts[i])
		if (p < min) {
			min = p
		} else if (p > max) {
			max = p
		}
	}
	
	return {'min': min, 'max': max}
}

function overlap(p1, p2) {
	if (p1.max > p2.min) {
		return true
	}
	if (p1.min > p2.max) {
		return true
	}

	return false
}