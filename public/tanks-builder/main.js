CanvasRenderingContext2D.prototype.fillRoundRect = function (x, y, w, h, r) {
	if (w < 2 * r) r = w / 2
	if (h < 2 * r) r = h / 2
	this.beginPath()
	this.moveTo(x+r, y)
	this.arcTo(x+w, y, x+w, y+h, r)
	this.arcTo(x+w, y+h, x, y+h, r)
	this.arcTo(x, y+h, x, y, r)
	this.arcTo(x, y, x+w, y, r)
	this.closePath()
	this.fill()
}

function load() {
	var c = document.getElementById("c")
	var ctx = c.getContext('2d')
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	var lastDownX = 0
	var lastDownY = 0
	var lastUpX = 0
	var lastUpY = 0
	
	var mx = 0
	var my = 0
	
	var dragging = false
	var placingTank = false
	var placingPowerup = false
	var pid = 0
	
	if (!localStorage.getItem("navMesh")) {
		var snap = 50
	}
	else {
		var snap = JSON.parse(localStorage.getItem("navMesh")).snap
	}
	
	var showingNav = false
	
	
	
	let cam = {}
	cam.x = 0
	cam.y = 0
	cam.z = 0.5
	
	var walls = []
	var wallsRender = []
	var tanks = []
	var tanksRender = []
	var powerups = []
	var powerupsRender = []
	
	const deafult = '{"tanks":[{"pos":{"x":-200,"y":-400},"color":"hsl(120, 70%, 65%)","pid":1,"size":{"x":75,"y":100}},{"pos":{"x":200,"y":400},"color":"hsl(360, 70%, 65%)","pid":2,"size":{"x":75,"y":100}}],"walls":[{"pos":{"x":0,"y":700},"size":{"x":2304,"y":300}},{"pos":{"x":0,"y":-700},"size":{"x":2304,"y":300}},{"pos":{"y":0,"x":1150},"size":{"y":2304,"x":300}},{"pos":{"y":0,"x":-1150},"size":{"y":2304,"x":300}},{"pos":{"x":0,"y":350},"size":{"x":100,"y":400}},{"pos":{"x":0,"y":-350},"size":{"x":100,"y":400}},{"pos":{"x":-300,"y":-200},"size":{"x":500,"y":100}},{"pos":{"x":300,"y":200},"size":{"x":500,"y":100}}],"cam":{"x":0,"y":0,"z":0.5}}'
	
	if (!localStorage.getItem("map")) {
		var map = JSON.parse(deafult)
		
		tanks = map.tanks
		walls = map.walls
		tanksRender = map.tanks
		wallsRender = map.walls
		cam = map.cam
	} else {
		var map = JSON.parse(window.localStorage.getItem("map"))
		
		tanks = map.tanks
		walls = map.walls
		tanksRender = map.tanks
		wallsRender = map.walls
		powerups = map.powerups
		powerupsRender = map.powerups
		cam = map.cam
	}
	
	
	var undoHistory = []
	
	function placeP1() {
		placingTank = true
		pid = 1
	}
	function placeP2() {
		placingTank = true
		pid = 2
	}
	function placeAI() {
		placingTank = true
		pid = 3
	}
	
	function placePowerup() {
		placingPowerup = true
	}
	
	function printFinal() {
		let fin = {tanks: tanks, walls: walls, cam: cam, powerups: powerups}
		
		localStorage.setItem('map', JSON.stringify(fin))
	}
	
	var gridSize = 75
	
	function generateAiPath() {
		var navMesh = []
		
		for (var x=-gridSize; x<gridSize; x++) {
			navMesh.push([])
			for (var y=-gridSize; y<gridSize; y++) {
				var walkable = true
				
				for (const wall of walls) {
					let x1 = wall.pos.x - wall.size.x/2
					let y1 = wall.pos.y - wall.size.y/2
					
					let x2 = wall.pos.x + wall.size.x/2
					let y2 = wall.pos.y + wall.size.y/2
					
					if ((x * snap + snap/2 > x1 && x * snap + snap/2 < x2) && (y * snap + snap/2 > y1 && y * snap + snap/2 < y2)) {
						walkable = false
						break
					}
				}
				
				if (walkable) {
					navMesh.at(-1).push(0)
				} else {
					navMesh.at(-1).push(1)
				}
			}
		}
		
		showingNav = true
		localStorage.setItem('navMesh', JSON.stringify({map: navMesh, snap: snap}))
	}
	
	function toggleNav() {
		showingNav = !showingNav
	}
	function zoomOut() {
		cam.z /= 1.2
	}
	function zoomIn() {
		cam.z *= 1.2
	}
	
	function snapOut() {
		snap -= 10
	}
	function snapIn() {
		snap += 10
	}
	
	function undo() {		
		if (undoHistory.at(-1) == "w") {
			walls.splice(-1)
			wallsRender.splice(-1)
		}
		if (undoHistory.at(-1) == "t") {
			tanks.splice(-1)
			tanksRender.splice(-1)
		}
		if (undoHistory.at(-1) == "p") {
			powerups.splice(-1)
			powerupsRender.splice(-1)
		}
		
		undoHistory.splice(-1)
	}
	
	function clearMap() {
		walls = []
		wallsRender = []
		tanks = []
		tanksRender = []
		powerups = []
		powerupsRender = []
		cam = {x: 0, y: 0, z: 0.5}
		snap = 50
		localStorage.removeItem("map")
		localStorage.removeItem("navMesh")
	}
	function clearTanks() {
		tanks = []
		tanksRender = []
	}
	
	function addBorder() {
		const borderSize = 3
		
		let xwall = Math.round(c.width/2/cam.z/snap)*snap
		let ywall = Math.round(c.height/2/cam.z/snap)*snap
		
		let wall = {}
		wall.pos = {}
		wall.size = {}
		
		wall.pos.x = 0
		wall.size.x = c.width / cam.z 
		wall.pos.y = ywall
		wall.size.y = borderSize * snap * 2
		
		undoHistory.push("w")
		
		walls.push(wall)
		wallsRender.push(wall)
		
		wall = {}
		wall.pos = {}
		wall.size = {}
		
		wall.pos.x = 0
		wall.size.x = c.width / cam.z 
		wall.pos.y = -ywall
		wall.size.y = borderSize * snap * 2
		
		undoHistory.push("w")
		
		walls.push(wall)
		wallsRender.push(wall)
		
		wall = {}
		wall.pos = {}
		wall.size = {}
		
		wall.pos.y = 0
		wall.size.y = c.width / cam.z 
		wall.pos.x = xwall
		wall.size.x = borderSize * snap * 2
		
		undoHistory.push("w")
		
		walls.push(wall)
		wallsRender.push(wall)
		
		wall = {}
		wall.pos = {}
		wall.size = {}
		
		wall.pos.y = 0
		wall.size.y = c.width / cam.z 
		wall.pos.x = -xwall
		wall.size.x = borderSize * snap * 2
		
		undoHistory.push("w")
		
		walls.push(wall)
		wallsRender.push(wall)
	}
	
	new nbButton("Save", printFinal)
	
	new nbButton("Player 1", placeP1)
	new nbButton("Player 2", placeP2)
	new nbButton("AI", placeAI)
	new nbButton("Powerup", placePowerup)
	
	new nbButton("Cam +", zoomIn)
	new nbButton("Cam -", zoomOut)
	
	new nbButton("Snap +", snapIn)
	new nbButton("Snap -", snapOut)
	
	new nbButton("Undo", undo)
	
	new nbButton("Add Border", addBorder)
	
	new nbButton("Clear", clearMap)
	new nbButton("Clear Tanks", clearTanks)
	
	new nbButton("Add Navmesh", generateAiPath)
	new nbButton("Show Navmesh", toggleNav)
	
	c.addEventListener('mousedown', function(event){
		lastDownX = Math.round(((event.clientX - c.width/2)/cam.z)/snap)*snap
		lastDownY = Math.round(((event.clientY - c.height/2)/cam.z)/snap)*snap
		
		if (!placingTank && !placingPowerup) {
			dragging = true
		}
		
	}, false)
	
	c.addEventListener('mouseup', function(event){
		if (dragging) {
			lastUpX = Math.round(((event.clientX - c.width/2)/cam.z)/snap)*snap
			lastUpY = Math.round(((event.clientY - c.height/2)/cam.z)/snap)*snap
			
			
			let wall = {}
			wall.pos = {}
			wall.size = {}
			
			wall.pos.x = lastDownX + -((lastDownX - mx)/2)
			wall.pos.y = -(lastDownY + -((lastDownY - my)/2))
			wall.size.x = Math.abs(lastDownX - mx)
			wall.size.y = Math.abs(lastDownY - my)
			
			if (wall.size.x > 0 && wall.size.y > 0) {
				undoHistory.push("w")
				
				walls.push(wall)
				wallsRender.push(wall)
			}
			
			dragging = false
		}
		if (placingTank) {
			placingTank = false
			let tank = {}
			tank.pos = {}
			tank.pos.x = lastDownX
			tank.pos.y = -lastDownY
			
			tank.color = pid === 1 ? 'hsl(120, 70%, 65%)' : pid === 2 ? 'hsl(360, 70%, 65%)' : 'hsl(250, 70%, 65%)'
			
			tank.pid = pid
			
			undoHistory.push("t")
			tanks.push(tank)
			tanksRender.push(tank)
		}
		if (placingPowerup) {
			placingPowerup = false
			let powerup = {}
			powerup.pos = {}
			powerup.pos.x = lastDownX
			powerup.pos.y = -lastDownY
			
			undoHistory.push("p")
			powerups.push(powerup)
			powerupsRender.push(powerup)
		}
	}, false)
	
	function updatePos(event) {
		mx = Math.round(((event.pageX - c.width/2)/cam.z)/snap)*snap
		my = Math.round(((event.pageY - c.height/2)/cam.z)/snap)*snap
	}

	c.addEventListener("mousemove", updatePos, false)
	c.addEventListener("mouseenter", updatePos, false)
	c.addEventListener("mouseleave", updatePos, false)
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		if (dragging) {	
			let wall = {}
			wall.pos = {}
			wall.size = {}
			
			wall.pos.x = lastDownX + -((lastDownX - mx)/2)
			wall.pos.y = -(lastDownY + -((lastDownY - my)/2))
			wall.size.x = Math.abs(lastDownX - mx)
			wall.size.y = Math.abs(lastDownY - my)
		
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((wall.pos.x) - cam.x, (wall.pos.y) - cam.y)
			ctx.fillStyle = palette.wall
			
			ctx.fillRect(-wall.size.x/2, -wall.size.y/2, wall.size.x, wall.size.y)
			
			ctx.fillStyle = "black"
		}
		for (const wall of wallsRender) {
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((wall.pos.x) - cam.x, (wall.pos.y) - cam.y)
			ctx.fillStyle = palette.wall
			
			ctx.fillRect(-wall.size.x/2, -wall.size.y/2, wall.size.x, wall.size.y)
			
			ctx.fillStyle = "black"
		}
		if (placingTank) {
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((mx) - cam.x, (-my) - cam.y)
			
			tank = {}
			tank.size = {}
			tank.size.x = 75
			tank.size.y = 100
			tank.color = pid === 1 ? 'hsl(120, 70%, 65%)' : pid === 2 ? 'hsl(360, 70%, 65%)' : 'hsl(250, 70%, 65%)'
			
			// Draw body
			ctx.fillStyle = tank.color.slice(0,14) +  parseInt(tank.color.slice(14,16)) + "%)"
			ctx.fillRoundRect(-tank.size.x/2, -tank.size.y/2, tank.size.x, tank.size.y, 7)
			
			// Draw turret base
			ctx.beginPath()
			ctx.arc(0, 0, 30, 0, 2 * Math.PI)
			ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + 20) + "%)"
			ctx.fill()
			
			// Draw turret
			ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + 20*2) + "%)"
			ctx.fillRect(-10, 0, 20, 60)
			
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			
			ctx.fillStyle = 'black'
		}
		if (placingPowerup) {
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((mx) - cam.x, (-my) - cam.y)
			
			ctx.fillStyle = "#eebbbb"
			ctx.beginPath()
			ctx.arc(0, 0, 25, 0, 2 * Math.PI)
			ctx.fill()
			ctx.fillStyle = "black"
			
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
		}
		for (powerup of powerupsRender) {
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((powerup.pos.x) - cam.x, (powerup.pos.y) - cam.y)
			
			ctx.fillStyle = "#eebbbb"
			ctx.beginPath()
			ctx.arc(0, 0, 25, 0, 2 * Math.PI)
			ctx.fill()
			ctx.fillStyle = "black"
			
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
		}
		for (tank of tanksRender) {
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			ctx.translate((tank.pos.x) - cam.x, (tank.pos.y) - cam.y)
			
			tank.size = {}
			tank.size.x = 75
			tank.size.y = 100
			
			// Draw body
			ctx.fillStyle = tank.color.slice(0,14) +  parseInt(tank.color.slice(14,16)) + "%)"
			ctx.fillRoundRect(-tank.size.x/2, -tank.size.y/2, tank.size.x, tank.size.y, 7)
			
			// Draw turret base
			ctx.beginPath()
			ctx.arc(0, 0, 30, 0, 2 * Math.PI)
			ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + 20) + "%)"
			ctx.fill()
			
			// Draw turret
			ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + 20*2) + "%)"
			ctx.fillRect(-10, 0, 20, 60)
			
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			
			ctx.fillStyle = 'black'
		}
		
		if (localStorage.getItem("navMesh") && showingNav) {
			let nav = JSON.parse(localStorage.getItem("navMesh"))
			let nm = nav.map
			snap = nav.snap
			
			ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
			ctx.scale(cam.z, -cam.z)
			
			for (var x=-gridSize; x<gridSize; x++) {
				for (var y=-gridSize; y<gridSize; y++) {
					if (nm[x+gridSize][y+gridSize] == 0) {
						ctx.fillStyle = "rgba(0, 255, 0, 0.2)"
					}
					if (nm[x+gridSize][y+gridSize] == 1) {
						ctx.fillStyle = "rgba(255, 0, 0, 0.2)"
					}
					
					ctx.fillRect(x * snap, y * snap, snap, snap)
				}
			}
		}
		
		ctx.setTransform(1, 0, 0, 1, c.width/2, 0)
		
		let wi = snap*cam.z
		
		for (x=1; x < 100; x++) {
			ctx.strokeStyle = "#eeeeee"
			ctx.lineWidth = 0.2
			ctx.translate(wi, 0)
				
			ctx.beginPath()
			ctx.moveTo(-wi * 50, -c.height)
			ctx.lineTo(-wi * 50, c.height)
			ctx.stroke()
		}
		ctx.setTransform(1, 0, 0, 1, 0, c.height/2)
		
		for (x=1; x < 100; x++) {
			ctx.strokeStyle = "#eeeeee"
			ctx.lineWidth = 0.2
			ctx.translate(0, -wi)
			
			ctx.beginPath()
			ctx.moveTo(c.width, wi * 50)
			ctx.lineTo(-c.width, wi * 50)
			ctx.stroke()
		}
		
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		
		ctx.strokeStyle = "#00ffff"
		ctx.lineWidth = 1
		
		ctx.beginPath()
		ctx.moveTo(c.width/2, 0)
		ctx.lineTo(c.width/2, c.height)
		ctx.stroke()
		
		ctx.beginPath()
		ctx.moveTo(0, c.height/2)
		ctx.lineTo(c.width, c.height/2)
		ctx.stroke()
		
		requestAnimationFrame(main)
	}
	
	main()
}

window.addEventListener('load', load)