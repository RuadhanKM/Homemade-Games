var c = document.getElementById("c")
var ctx = c.getContext('2d')
c.width = window.innerWidth
c.height = window.innerHeight

let cam = {}
cam.x = 0
cam.y = 0
cam.z = 0.8

let player = new car({
	// 1/10 scale, based off of a ford mustang
	
	'Engineforce': 34568,
	'Mass': 175,
	'TurnSpeed': 100,
	'MaxTurn': 45,
	
	'C_drag': 0.0425,
	'C_rollingResistance': 1.28,
	'C_corneringStiffness': 0,
})

var wall = new poly
(
	[
		{'x': 30, 'y': 30},
		{'x': 30, 'y': -30},
		{'x': -30, 'y': -30},
		{'x': -30, 'y': 30}
	],
	
	{'x': 200, 'y': 0}
)

wall.scale = 2

var start = 0
function main(timestamp) {
	var dt = (timestamp - start) / 1000
	
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	player.update(dt)
	
	cam.x = player.hitbox.x
	cam.y = player.hitbox.y
	
	render(wall)
	
	start = timestamp
	requestAnimationFrame(main)
}
main(0.01)