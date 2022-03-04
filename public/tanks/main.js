function load() {
	var c = document.getElementById("c")
	var ctx = c.getContext('2d')
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	let cam = {}
	cam.x = 0
	cam.y = 0
	cam.z = 0.5
	
	const deafult = '{"tanks":[{"pos":{"x":-200,"y":-400},"color":"hsl(120, 70%, 65%)","pid":1,"size":{"x":75,"y":100}},{"pos":{"x":200,"y":400},"color":"hsl(360, 70%, 65%)","pid":2,"size":{"x":75,"y":100}}],"walls":[{"pos":{"x":0,"y":700},"size":{"x":2304,"y":300}},{"pos":{"x":0,"y":-700},"size":{"x":2304,"y":300}},{"pos":{"y":0,"x":1150},"size":{"y":2304,"x":300}},{"pos":{"y":0,"x":-1150},"size":{"y":2304,"x":300}},{"pos":{"x":0,"y":350},"size":{"x":100,"y":400}},{"pos":{"x":0,"y":-350},"size":{"x":100,"y":400}},{"pos":{"x":-300,"y":-200},"size":{"x":500,"y":100}},{"pos":{"x":300,"y":200},"size":{"x":500,"y":100}}],"cam":{"x":0,"y":0,"z":0.5}}'
	
	const speed = 5
	const lookRotSpeed = 3 // unused
	const moveRotSpeed = 2.5
	
	let players = []
	
	if (!localStorage.getItem("map")) {
		var map = JSON.parse(deafult)
		
		for (const mtank of map.tanks) {
			let player = new tank(mtank.pos.x, mtank.pos.y, mtank.color)
			player.pid = mtank.pid
			player.moveRotSpeed = moveRotSpeed
			player.speed = speed
			players.push(player)
		}
		for (const mwall of map.walls) {
			new wall(mwall.pos.x, mwall.pos.y, mwall.size.x, mwall.size.y)
		}
		
		cam = map.cam
	} else {
		var map = JSON.parse(window.localStorage.getItem("map"))
		
		for (const mtank of map.tanks) {
			let player = new tank(mtank.pos.x, mtank.pos.y, mtank.color)
			player.pid = mtank.pid
			player.moveRotSpeed = moveRotSpeed
			player.speed = speed
			players.push(player)
		}
		for (const mwall of map.walls) {
			new wall(mwall.pos.x, mwall.pos.y, mwall.size.x, mwall.size.y)
		}
		for (const mpowerup of map.powerups) {
			new powerupPos(mpowerup.pos)
		}
		
		cam = map.cam
	}
	
	function i1(tank) {
		tank.speed *= 2
		tank.moveRotSpeed *= 2
	}
	function e1(tank) {
		tank.speed /= 2
		tank.moveRotSpeed /= 2
	}
	new powerup(i1, e1, "#eebbbb", 6000)
	function i2(tank) {
		tank.fireRate /= 5
	}
	function e2(tank) {
		tank.fireRate *= 5
	}
	new powerup(i2, e2, "#bbeebb", 3000)
	function i3(tank) {
		let ogAngle = tank.moveAngle
		
		for (var i=0; i<90; i++) {
			tank.lookAngle = i * 4
			tank.canShoot = true
			let bullet = tank.shoot()
			bullet.wallPen = 9999999
			bullet.speed = 3.5
		}
		
		tank.lookAngle = ogAngle
	}
	function e3(tank) {return}
	new powerup(i3, e3, "#bbbbee", 0)
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		for (const player of players) {
			if (player.pid == 3) {
				player.ai()
			} else {
				player.userInput()
			}
		}
		
		miscMain()
		render(cam, c, ctx)
		requestAnimationFrame(main)
	}
	
	main()
}

window.addEventListener('load', load)