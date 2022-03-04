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

var tanks = []
var aliveTanks = []
var walls = []
var projs = []
var powerups = []
var allPowerups = []
var powerupPositions = []

var playing = true
var powerupOn = false

if (localStorage.getItem("navMesh")) {
	var fnm = JSON.parse(localStorage.getItem("navMesh"))
	var snap = fnm.snap
	var navMesh = fnm.map
	var grid = new PF.Grid(navMesh.length, navMesh.length)
	
	for (var x=0; x<navMesh.length; x++) {
		for (var y=0; y<navMesh.length; y++) {
			if (x == 0 || y == 0 || x == navMesh.length - 1 || y == navMesh.length - 1) {
				grid.setWalkableAt(x, y, false)
				continue
			}
			
			if (navMesh[x][y] == 1) {
				grid.setWalkableAt(x, y, false)
			} else {
				grid.setWalkableAt(x, y, true)
			}
		}
	}
}

function dot(u, v) {
    return u.x * v.x + u.y * v.y
}

function lerp(a,b,t) {
	return a + (b - a) * t
}

var lastWinner

function intersect(a,b,c,d,p,q,r,s) {
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};

function endMisc(winner) {
	lastWinner = winner
	playing = false
	projs = []
	winner.kills += 1
	
	setTimeout(function(){
		for (const tank of tanks) {
			if (tank.pid > 0){
				playing = true
				
				tank.pos.x = tank.sp.x
				tank.pos.y = tank.sp.y
				tank.lookAngle = 0
				tank.moveAngle = 0
				tank.visable = true
			}
		}
	}, 3000)
}

class wall {
	constructor(x, y, w, h) {
		this.pos = {}
		this.pos.x = x
		this.pos.y = y
		
		this.size = {}
		this.size.x = w
		this.size.y = h
		
		walls.push(this)
	}
	
	pointInRect(pos) {
		let x1 = this.pos.x - this.size.x/2
		let y1 = this.pos.y - this.size.y/2
		
		let x2 = this.pos.x + this.size.x/2
		let y2 = this.pos.y + this.size.y/2

		return (pos.x > x1 && pos.x < x2) && (pos.y > y1 && pos.y < y2)
	}
}

class proj {
	constructor(pos, dir, speed, tank){
		this.pos = {}
		this.pos.x = pos.x - dir.x * 50
		this.pos.y = pos.y - dir.y * 50
		
		this.dir = {}
		this.dir.x = dir.x
		this.dir.y = dir.y
		
		this.size = {}
		this.size.x = 10
		this.size.y = 10
		
		this.canSelfDammage = false
		
		this.speed = speed
		this.tank = tank
		
		this.wallPen = 150
		
		this.time = 700
		
		this.angle = (Math.atan2(this.dir.x, this.dir.y)*180/Math.PI)
		
		projs.push(this)
	}
	
	destroy(){
		projs = projs.filter(item => item !== this)
	}
	
	update(){
		this.pos.x -= this.dir.x * this.speed
		this.pos.y -= this.dir.y * this.speed
		
		this.time -= 1
		
		for (const tank of tanks) {			
			if (tank.checkCol(this) && tank.visable) {
				if (tank === this.tank) {
					if (this.canSelfDammage) {
						tank.visable = false
						this.destroy()
					}
				} else {				
					tank.visable = false
					this.destroy()
				}
			}
		}
		
		for (const wall of walls) {
			if (wall.pointInRect(this.pos)) {
				this.canSelfDammage = true
				
				let sides = [
					Math.abs(this.pos.y - (wall.pos.y - wall.size.y/2)),
					Math.abs(this.pos.y - (wall.pos.y + wall.size.y/2)),
					Math.abs(this.pos.x - (wall.pos.x - wall.size.x/2)),
					Math.abs(this.pos.x - (wall.pos.x + wall.size.x/2))
				]
				
				let side = sides.indexOf(Math.min(...sides))
				
				if (side === 0) {
					this.dir.y = 0 - this.dir.y
				}
				if (side === 1) {
					this.dir.y = 0 - this.dir.y
				}
				if (side === 2) {
					this.dir.x = 0 - this.dir.x
				}
				if (side === 3) {
					this.dir.x = 0 - this.dir.x
				}
				
				this.time -= this.wallPen
				
				this.angle = (Math.atan2(this.dir.x, this.dir.y)*180/Math.PI)
				
				this.pos.x -= this.dir.x * this.speed
				this.pos.y -= this.dir.y * this.speed
				
				break
			}
		}
		
		if (this.time <= 1) {
			this.destroy()
		}
	}
}

class powerup {
	constructor(initfunc, endfunc, color, time) {
		this.color = color
		this.initfunc = initfunc
		this.endfunc = endfunc
		this.time = time
		
		this.size = {}
		this.size.x = 25
		this.size.y = 25
		
		this.pos = {}
		
		allPowerups.push(this)
	}
}

function spawnPowerup() {
	if (powerupPositions.length > 0) {
		powerupOn = true
		
		let powpos = powerupPositions[Math.floor(Math.random()*powerupPositions.length)]
		let p = allPowerups[Math.floor(Math.random() * allPowerups.length)]
		
		console.log(p)
		
		p.pos = powpos.pos
		powerups.push(p)
	}
}

class powerupPos {
	constructor(pos) {
		this.pos = pos
		
		powerupPositions.push(this)
	}
}

var curpath
var pathUpdated = true
var debug = true

class tank {
	constructor(x, y, color){
		this.pos = {}
		this.pos.x = x
		this.pos.y = y
		this.color = color
		
		this.sp = {x: x, y: y}
		
		this.lookDir = {}
		this.lookDir.x = 0
		this.lookDir.y = 1
		this.moveDir = {}
		this.moveDir.x = 0
		this.moveDir.y = 1
		
		this.pid = 0
		this.kills = 0
		
		this.exept = []
		
		this.visable = true
		
		this.size = {}
		this.size.x = 75
		this.size.y = 100
		
		this.canShoot = true
		this.fireRate = 700
		
		this.lookAngle = 0
		this.moveAngle = 0
		
		tanks.push(this)
	}

	checkCol(other){
		if (this.exept.includes(other)) { return false }
		
		let r1 = {}
		r1.x = this.pos.x - 100/2
		r1.y = this.pos.y - 100/2
		r1.w = 100
		r1.h = 100
		
		let r2 = {}
		
		r2.x = other.pos.x - other.size.x/2
		r2.y = other.pos.y - other.size.y/2
		r2.w = other.size.x
		r2.h = other.size.y
		
		if (
			r1.x < r2.x + r2.w &&
			r1.x + r1.w > r2.x &&
			r1.y < r2.y + r2.h &&
			r1.y + r1.h > r2.y
		) 
		{
			return true
		}
		return false
	}
	
	getAngleFromPos(x, y){
		return Math.atan2(x, y)*180/Math.PI
	}
	
	lookAngleFromDir(){
		return Math.atan2(this.lookDir.x, this.lookDir.y)*180/Math.PI
	}
	moveAngleFromDir(){
		return Math.atan2(this.moveDir.x, this.moveDir.y)*180/Math.PI
	}
	
	lookDirFromAngle(){
		let v = {}
		v.x = Math.cos((this.lookAngle-90) * Math.PI/180)
		v.y = Math.sin((this.lookAngle-90) * Math.PI/180)
		return v
	}
	moveDirFromAngle(){
		let v = {}
		v.x = Math.cos((this.moveAngle-90) * Math.PI/180)
		v.y = Math.sin((this.moveAngle-90) * Math.PI/180)
		return v
	}
	
	shoot(){
		let cs = this
		
		if (cs.canShoot) {
			cs.canShoot = false
			let bullet = new proj(this.pos, this.lookDirFromAngle(), 10, this)
			
			setTimeout(function(){
				cs.canShoot = true
			}, this.fireRate)
			
			return bullet
		}
	}
	
	userInput() {
		if (this.pid === 1) {
			if (pressedKeys["65"]) {
				this.moveAngle += this.moveRotSpeed
				this.lookAngle += this.moveRotSpeed
			}
			if (pressedKeys["68"]) {
				this.moveAngle -= this.moveRotSpeed
				this.lookAngle -= this.moveRotSpeed
			}
			if (pressedKeys["87"]) {
				this.moveForward(-this.speed)
			}
			if (pressedKeys["83"]) {
				this.moveForward(this.speed)
			}
			if (pressedKeys["81"] && playing) {
				this.shoot()
			}
		}
		if (this.pid === 2) {
			if (pressedKeys["37"]) {
				this.moveAngle += this.moveRotSpeed
				this.lookAngle += this.moveRotSpeed
			}
			if (pressedKeys["39"]) {
				this.moveAngle -= this.moveRotSpeed
				this.lookAngle -= this.moveRotSpeed
			}
			if (pressedKeys["38"]) {
				this.moveForward(-this.speed)
			}
			if (pressedKeys["40"]) {
				this.moveForward(this.speed)
			}
			if (pressedKeys["16"] && playing) {
				this.shoot()
			}
		}
	}
	
	ai() {
		if (!playing) {return}
		
		let target = tanks[0]
		for (const tank of tanks) {
			if (tank === this) {continue}
			
			let dis = Math.sqrt(Math.abs(tank.pos.x - this.pos.x)**2 + Math.abs(tank.pos.y - this.pos.y)**2)
			let disOld = Math.sqrt(Math.abs(target.pos.x - this.pos.x)**2 + Math.abs(target.pos.y - this.pos.y)**2)
			if (dis < disOld) {
				target = tank
			}
		}
		
		let canSee = true
		
		for (const wall of walls) {
			let a = {x: wall.pos.x + wall.size.x/2, y: wall.pos.y + wall.size.y/2}
			let b = {x: wall.pos.x - wall.size.x/2, y: wall.pos.y + wall.size.y/2}
			let c = {x: wall.pos.x - wall.size.x/2, y: wall.pos.y - wall.size.y/2}
			let d = {x: wall.pos.x + wall.size.x/2, y: wall.pos.y - wall.size.y/2}
			
			let ac = intersect(this.pos.x, this.pos.y, target.pos.x, target.pos.y, a.x, a.y, b.x, b.y)
			let bc = intersect(this.pos.x, this.pos.y, target.pos.x, target.pos.y, b.x, b.y, c.x, c.y)
			let cc = intersect(this.pos.x, this.pos.y, target.pos.x, target.pos.y, c.x, c.y, d.x, d.y)
			let dc = intersect(this.pos.x, this.pos.y, target.pos.x, target.pos.y, d.x, d.y, a.x, a.y)
			
			if (ac || bc || cc || dc) {
				canSee = false
				break
			}
		}
		
		if (canSee) {
			let relitivePosition = {x: target.pos.x - this.pos.x, y: target.pos.y - this.pos.y}
			let dis = Math.sqrt(relitivePosition.x**2 + relitivePosition.y**2)
			let timeToPos = dis/10
			
			relitivePosition.x += target.moveDir.x * -target.speed * timeToPos
			relitivePosition.y += target.moveDir.y * -target.speed * timeToPos
			
			let targetAngle = 90 - (Math.atan2(relitivePosition.x, relitivePosition.y) / Math.PI * 180) - 90
			
			this.moveAngle = targetAngle
			this.shoot()
		}
		if (!canSee && grid) {
			let l = navMesh.length
			
			let targetGridPos = {x: Math.round(target.pos.x/snap)+l/2, y: Math.round(target.pos.y/snap)+l/2}
			let aiGridPos = {x: Math.round(this.pos.x/snap)+l/2, y: Math.round(this.pos.y/snap)+l/2}
			
			var finder = new PF.AStarFinder()
			var gridBackup = grid.clone()
			var path = finder.findPath(aiGridPos.x, aiGridPos.y, targetGridPos.x, targetGridPos.y, gridBackup)
			
			if (path.length > 1) {
				curpath = path
				pathUpdated = true
			} else {
				pathUpdated = false
			}
			
			if (curpath.length > 3) {
				var nextPos = {}
				nextPos.x = (curpath[2][0] - l/2) * snap + snap/2
				nextPos.y = (curpath[2][1] - l/2) * snap + snap/2
				
				let relitivePosition = {x: nextPos.x - this.pos.x, y: nextPos.y - this.pos.y}
				let targetAngle = 90 - (Math.atan2(relitivePosition.x, relitivePosition.y) / Math.PI * 180) - 90
				
				this.moveAngle = targetAngle
				this.moveForward(-this.speed)
			}
		}
		
		this.lookAngle = this.moveAngle
	}
	
	moveForward(speed){
		this.moveDir = this.moveDirFromAngle()

		this.pos.x += this.moveDir.x * speed
		this.pos.y += this.moveDir.y * speed
		
		let collided = false
		for (const wall of walls) {
			if (this.checkCol(wall)) {
				collided = true
				break
			}
		}
		
		for (const powerup of powerups) {
			if (this.checkCol(powerup)) {
				powerup.initfunc(this)
				let t = this
				setTimeout(function() {
					powerup.endfunc(t)
					powerupOn = false
				}, powerup.time)
				powerups.splice(powerups.indexOf(powerup), 1)
				break
			}
		}
		
		if (collided) {
			this.pos.y -= this.moveDir.y * speed
			
			let collided = false
			for (const wall of walls) {
				if (this.checkCol(wall)) {
					collided = true
					break
				}
			}
			
			if (collided) {
				this.pos.x -= this.moveDir.x * speed
				this.pos.y += this.moveDir.y * speed
				
				let collided = false
				for (const wall of walls) {
					if (this.checkCol(wall)) {
						collided = true
						break
					}
				}
				
				if (collided) {
					this.pos.y -= this.moveDir.y * speed
				}
			}
		}
	}
	
	destroy(){
		tanks = tanks.filter(item => item !== this)
	}
}

var pressedKeys = {}
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true }

const colorSeperation = 12

function lerp(a, b, x){
	return a + (b - a) * x
}

function miscMain(){
	for (const p of projs) {
		p.update()
	}
	
	aliveTanks = []
	
	for (const tank of tanks) {
		if (tank.visable) {
			aliveTanks.push(tank)
		}
	}
	
	if (aliveTanks.length === 1 && playing) {
		endMisc(aliveTanks[0])
	}
	
	if (!powerupOn) {
		powerupOn = true
		let timeToPowerup = (Math.random() + 3) * 5000
		setTimeout(spawnPowerup, timeToPowerup)
	}
}

function render(cam, canvas, ctx) {
	for (const wall of walls) {
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, -cam.z)
		ctx.translate((wall.pos.x) - cam.x, (wall.pos.y) - cam.y)
		ctx.fillStyle = palette.wall
		
		ctx.fillRect(-wall.size.x/2, -wall.size.y/2, wall.size.x, wall.size.y)
		
		ctx.fillStyle = "black"
	}
	for (const p of projs) {
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, -cam.z)
		ctx.translate((p.pos.x) - cam.x, (p.pos.y) - cam.y)
		
		ctx.fillStyle = p.tank.color.slice(0,14) + ((p.time/12) + 30) + "%)"
		ctx.rotate(-p.angle * Math.PI / 180)
		ctx.fillRect(-7.5, 0, 15, 30)
		ctx.fillStyle = "black"
		
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
	}
	for (const powerup of powerups) {
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, -cam.z)
		ctx.translate((powerup.pos.x) - cam.x, (powerup.pos.y) - cam.y)
		
		ctx.fillStyle = powerup.color
		ctx.beginPath()
		ctx.arc(0, 0, powerup.size.x, 0, 2 * Math.PI)
		ctx.fill()
		ctx.fillStyle = "black"
		
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
	}
	for (const tank of tanks) {
		if (!tank.visable) {continue}
		
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, -cam.z)
		ctx.translate((tank.pos.x) - cam.x, (tank.pos.y) - cam.y)
		
		// Draw body
		ctx.rotate(tank.moveAngle * Math.PI / 180)
		ctx.fillStyle = tank.color.slice(0,14) +  parseInt(tank.color.slice(14,16)) + "%)"
		ctx.fillRoundRect(-tank.size.x/2, -tank.size.y/2, tank.size.x, tank.size.y, 7)
		ctx.rotate(-tank.moveAngle * Math.PI / 180)
		
		// Draw turret base
		ctx.beginPath()
		ctx.arc(0, 0, 30, 0, 2 * Math.PI)
		ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + colorSeperation) + "%)"
		ctx.fill()
		
		// Draw turret
		ctx.rotate(tank.lookAngle * Math.PI / 180)
		ctx.fillStyle = tank.color.slice(0,14) + (parseInt(tank.color.slice(14,16)) + colorSeperation*2) + "%)"
		ctx.fillRect(-10, 0, 20, 60)
		ctx.rotate(-tank.lookAngle * Math.PI / 180)
		
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		
		let dis = (canvas.width - 100)/(tanks.length-1)
		
		ctx.fillStyle = tank.color.slice(0,14) +  parseInt(tank.color.slice(14,16)) + "%)"
		ctx.font = '100px monospace'
		ctx.setTransform(1, 0, 0, 1, 0, canvas.height)
		let len = ctx.measureText(tank.kills).width/2
		ctx.fillText(tank.kills, (tanks.indexOf(tank) * dis)-len + 50, -10)
		
		ctx.fillStyle = 'black'
	}
	if (!playing) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		ctx.fillRect(0, 0, c.width, c.height)
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		
		if (lastWinner.pid === 1){
			ctx.fillStyle = lastWinner.color.slice(0,14) +  parseInt(lastWinner.color.slice(14,16)) + "%)"
			ctx.font = '100px monospace'
			let len = ctx.measureText("Player 1 Wins!")
			ctx.fillText("Player 1 Wins!", -len.width/2, 0)
		} 
		else if (lastWinner.pid === 2){
			ctx.fillStyle = lastWinner.color.slice(0,14) +  parseInt(lastWinner.color.slice(14,16)) + "%)"
			ctx.font = '100px monospace'
			let len = ctx.measureText("Player 2 Wins!")
			ctx.fillText("Player 2 Wins!", -len.width/2, 0)
		}
		else {
			ctx.fillStyle = lastWinner.color.slice(0,14) +  parseInt(lastWinner.color.slice(14,16)) + "%)"
			ctx.font = '100px monospace'
			let len = ctx.measureText("AI Wins!")
			ctx.fillText("AI Wins!", -len.width/2, 0)
		}
		
		
		ctx.fillStyle = 'black'
	}
	
	if (curpath && debug) {
		ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
		ctx.scale(cam.z, -cam.z)
		
		for (const pos of curpath) {
			if (pathUpdated) {
				ctx.fillStyle = "rgba(0, 255, 0, 0.2)"
			} else {
				ctx.fillStyle = "rgba(255, 0, 0, 0.2)"
			}

			ctx.fillRect((pos[0]-navMesh.length/2) * snap, (pos[1]-75) * snap, snap, snap)
		}
	}
}