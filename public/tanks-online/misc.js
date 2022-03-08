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

var playing = true

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
	
	update(hosting){
		this.pos.x -= this.dir.x * this.speed
		this.pos.y -= this.dir.y * this.speed
		
		this.time -= 1
		
		for (const tank of tanks) {			
			if (tank.checkCol(this) && tank.visable && hosting) {
				if (tank == this.tank) {
					if (this.canSelfDammage) {
						let message = {}
						
						message.prot = "kill"
						message.data = {}
						message.data.tank = tank.pid
						message.data.proj = projs.indexOf(this)
						message.data.hosting = hosting
						ws.send(JSON.stringify(message))
						
						tank.visable = false
					}
				} else {				
					let message = {}
					
					message.prot = "kill"
					message.data = {}
					message.data.tank = tank.pid
					message.data.proj = projs.indexOf(this)
					message.data.hosting = hosting
					ws.send(JSON.stringify(message))
					
					tank.visable = false
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
	
	shoot(doSend, mes=""){
		let cs = this
		
		if (cs.canShoot && doSend) {
			cs.canShoot = false
			let bullet = new proj(this.pos, this.lookDirFromAngle(), 10, this)
			
			setTimeout(function(){
				cs.canShoot = true
			}, this.fireRate)
			
			let message = {}
			message.prot = "shoot"
			
			let data = {}
			data.pos = this.pos
			data.angle = this.lookDirFromAngle()
			data.hosting = this.pid == 1
			
			message.data = data
			ws.send(JSON.stringify(message))
			
			return bullet
		}
		if (!doSend) {
			let bullet = new proj(mes.data.pos, mes.data.angle, 10, this)
			
			return bullet
		}
	}
	
	userInput(connected) {
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
		if (pressedKeys["81"] && playing && connected) {
			this.shoot(true)
		}
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

function miscMain(hosting, wsc){
	for (const p of projs) {
		p.update(hosting)
	}
	
	ws = wsc
	
	aliveTanks = []
	
	for (const tank of tanks) {
		if (tank.visable) {
			aliveTanks.push(tank)
		}
	}
	
	if (aliveTanks.length === 1 && playing) {
		endMisc(aliveTanks[0])
	}
}

function render(cam, canvas, ctx, debugText="", debugTextColor="#ffffff") {
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
	
	ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
	ctx.scale(cam.z, cam.z)
	
	ctx.fillStyle = debugTextColor
	ctx.font = '100px monospace'
	let lines = debugText.split('\n')
	let height = lines.length * 100

	for (var i = 0; i<lines.length; i++) {
		let len = ctx.measureText(lines[i])
		ctx.fillText(lines[i], -len.width/2, (i*100) - height/2)
	}
}