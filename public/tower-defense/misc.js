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

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
	if (w < 2 * r) r = w / 2
	if (h < 2 * r) r = h / 2
	this.beginPath()
	this.moveTo(x+r, y)
	this.arcTo(x+w, y, x+w, y+h, r)
	this.arcTo(x+w, y+h, x, y+h, r)
	this.arcTo(x, y+h, x, y, r)
	this.arcTo(x, y, x+w, y, r)
	this.closePath()
}

Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max)
}

CanvasRenderingContext2D.prototype.wrapText = function(text, x, y, maxWidth, lineHeight, centered=true) {
	var cars = text.split("\n")

	for (var ii = 0; ii < cars.length; ii++) {
		var line = ""
		var words = cars[ii].split(" ")

		for (var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + " "
			var metrics = this.measureText(testLine)
			var testWidth = metrics.width

			if (testWidth > maxWidth) {
				let newLineLen = this.measureText(line).width
				this.fillText(line, x - (centered ? newLineLen/2 : 0), y)
				line = words[n] + " "
				y += lineHeight
			}
			else {
				line = testLine
			}
		}
		
		let newLineLen = this.measureText(line).width
		this.fillText(line, x - (centered ? newLineLen/2 : 0), y)
		y += lineHeight
	}
}


function random(min, max) {
	return Math.random() * (max - min) + min;
}

var towers = []
var towerTypes = []
var towerTypesName = {}
var enemies = []
var path
var waveInProgress = false
var playing = true

var money = 500
var wave = 0

var page = 1
var pages = 2
var onPageClick = false

var placingTower = false
var placingTT

var ableToPlace = true
var deleteMode = false
window.snap = true

var renderQue = []

class vector2{
	constructor(x, y){
		this.x = x
		this.y = y
	}
	
	get mag() {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}
	get norm() {
		return new vector2(this.x/this.mag, this.y/this.mag)
	}
	disTo(other) {
		return this.sub(other).mag
	}
	add(other) {
		return new vector2(this.x + other.x, this.y + other.y)
	}
	sub(other) {
		return new vector2(this.x - other.x, this.y - other.y)
	}
}

var canvasSize = new vector2(0,0)

class vector3{
	constructor(x, y, z){
		this.x = x
		this.y = y
		this.z = z
	}
}

var mouseDown = 0

const snap = 50
window.onmousedown = function() { 
	if (placingTower && ableToPlace) {
		let mx = mousePos.x
		let my = mousePos.y
		
		if (window.snap) {
			mx = Math.round((mx-canvasSize.x/2)/snap)*snap
			my = Math.round((((my-canvasSize.y/2)*-1))/snap)*snap
		}
		
		new tower(new vector2(mx, my), placingTT)
		
		
		placingTT = undefined
		placingTower = false
	}

	mouseDown = 1
}
window.onmouseup = function() {
	onPageClick = false
	
	mouseDown = 0
}

var mousePos = new vector2(0,0)
window.onmousemove = function(e){
	let mx = e.clientX
	let my = e.clientY
	
	mousePos = new vector2(mx, my)
}

window.onkeydown = function(e){
	if (e.keyCode == 27) {
		deleteMode = false
		placingTower = false
		placingTT = undefined
	}
}

class towerType{
	constructor(price, color, name, range, fireRate, costInc, desc, fire, doTarget=true, hidden=false) {
		this.price = price
		this.color = color
		this.name = name
		this.range = range
		this.fire = fire
		this.desc = desc
		this.costInc = costInc
		this.fireRate = fireRate
		this.doTarget = doTarget
		this.hidden = hidden
		
		towerTypesName[name] = this
		towerTypes.push(this)
	}
}

class Path{
	constructor(p, width, color, start, health){
		this.p = p
		this.w = width
		this.c = color
		this.s = start
		this.h = health
		
		let len = 0
		for (const segment of p) {
			len += segment.mag
		}
		this.l = len

		path = this
	}
}

class enemy{
	constructor(health, color, speed, moneyOnKill){
		this.progress = 0
		this.health = health
		this.color = color
		this.speed = speed
		this.moneyOnKill = moneyOnKill
		
		this.size = new vector2(30, 30)
		
		var t = this
		
		enemies.push(this)
	}
	
	update(){
		this.progress += (this.speed/500)
		if (this.progress >= path.l) {
			enemies.splice(enemies.indexOf(this), 1)
			path.h -= 1
			if (path.h <= 0) {
				playing = false
				placingTower = false
				placingTT = undefined
			}
		}
	}
	
	die() {
		enemies.splice(enemies.indexOf(this), 1)
		money += this.moneyOnKill
	}
	
	get pos(){
		let pos = path.s
		let segPro = 0
		let segi = 0
		let seg = path.p[0]
		
		for (var i=0; i<this.progress; i++) {
			segPro++
			pos = pos.add(seg.norm)
			if (segPro > seg.mag && seg !== path.p.at(-1)) {
				segPro = 0
				segi++
				seg = path.p[segi]
			}
		}
		
		return pos
	}
}

class tower{
	constructor(pos, tt) {
		this.pos = pos
		this.towerType = tt
		this.sellPrice = tt.price
		
		this.size = new vector2(40, 40)
		
		this.canShoot = true
		money -= tt.price
		tt.price += tt.costInc
		
		towers.push(this)
	}
	
	update() {
		if (!this.canShoot) {return}
		
		let target
		
		for (const enemy of enemies){
			let dis = this.pos.disTo(enemy.pos)
			
			if (dis <= this.towerType.range) {
				if (target) {
					if (target.progress < enemy.progress) {target = enemy}
				} else {
					target = enemy
				}
			}
		}
		
		if (target || !this.towerType.doTarget) {
			this.towerType.fire(target, this, enemies, towers)
			this.canShoot = false
			let t = this
			setTimeout(function(){
				t.canShoot = true
			}, t.towerType.fireRate)
		}
	}
}

function miscMain(){
	if (!playing) {return}
	
	for (const enemy of enemies) {
		enemy.update()
	}
	for (const tower of towers) {
		tower.update()
	}
}

let buttonWidth = 250
let buttonHeight = 115
let descDis = 80
let topMargin = 80
let buttonGap = 10
let dif = 10

let buttonHeight2 = 70
let topMargin2 = 30

function startWave(){
	waveInProgress = true
	wave++
	
	new enemy(75, "#38749c", random(520, 600), 50)
	
	for (var a=0; a<(wave*15).clamp(0, 100); a++) {
		if (random(0, 1) < 0.2 && wave<15) {
			new enemy(130, "#38749c", random(400, 700), 15)
		}
	}
	
	for (var a=0; a<((wave-4)*2).clamp(0, 100); a++) {
		if (random(0, 1) < 0.8 && wave >= 5 && wave <= 25) {
			new enemy(1200, "#0031c4", random(300, 400), 40)
		}
	}
	
	for (var a=0; a<(((wave-6)**2).clamp(0, 500)); a++) {
		if (random(0, 1) < 0.5 && wave >= 8) {
			new enemy(60 + (wave*4), "#9263ad", random(500, 2100), 0)
		}
	}
	
	for (var a=0; a<(wave-11).clamp(0, 100); a++) {
		if (wave >= 12) {
			if (random(0,1) < 0.9) {
				new enemy(10000, "#fff", random(150 + (4*wave), 250 + (4*wave)), 100)
			}
		}
	}
	
	for (var a=0; a<(wave*3).clamp(0, 300); a++) {
		if (random(0, 1) < 0.1 && wave >= 15) {
			new enemy(2800, "#000", random(800, 1500), 50)
		}
	}
	
	for (var a=0; a<(wave-25).clamp(0, 300); a++) {
		if (random(0, 1) < 0.6 && wave >= 30) {
			new enemy(8000, "#6c008c", random(1500, 2400), 60)
		}
	}
	
	
	setTimeout(function(){
		waveInProgress = false
	}, 10000)
}

const towerSize = 49

function save() {
	localStorage.setItem('lives', path.h)
	localStorage.setItem('money', money)
	localStorage.setItem('wave', wave)
	localStorage.setItem('towers', JSON.stringify(towers))
	localStorage.setItem('tt', JSON.stringify(towerTypes))
}

function loadSave() {
	towers = []
	for (const towerMake of JSON.parse(localStorage.getItem("towers"))) {
		let t = new tower(new vector2(towerMake.pos.x, towerMake.pos.y), towerTypesName[towerMake.towerType.name])
		t.sellPrice = parseInt(towerMake.sellPrice)
	}
	for (const ttMake of JSON.parse(localStorage.getItem("tt"))) {
		towerTypesName[ttMake.name].price = ttMake.price
	}
	path.h = parseInt(localStorage.getItem("lives"))
	money = parseInt(localStorage.getItem("money"))
	wave = parseInt(localStorage.getItem("wave"))
}

function render(cam, canvas, ctx){
	ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
	ctx.scale(cam.z, -cam.z)
	
	canvasSize = new vector2(canvas.width, canvas.height)
	
	ctx.beginPath()
	let pathPos = path.s
	ctx.moveTo(pathPos.x, pathPos.y)
	ctx.lineWidth = path.w
	
	for (const segment of path.p) {
		pathPos = pathPos.add(segment)
		ctx.lineTo(pathPos.x, pathPos.y)
	}
	
	ctx.strokeStyle = path.c
	
	if (placingTower) {
		let mx = mousePos.x
		let my = mousePos.y

		let adjustedMP = new vector2(mx-canvas.width/2, (my-canvas.height/2))
		
		if (window.snap) {
			mx = Math.round((adjustedMP.x)/(snap))*(snap)
			my = Math.round((adjustedMP.y)/(snap))*(snap)
		}
		
		mx += canvas.width/2
		my += canvas.height/2
		
		if (ctx.isPointInStroke(mx + towerSize/2, my + towerSize/2) || ctx.isPointInStroke(mx + towerSize/2, my - towerSize/2) || ctx.isPointInStroke(mx - towerSize/2, my + towerSize/2) || ctx.isPointInStroke(mx - towerSize/2, my - towerSize/2)) {
			ableToPlace = false
		} else {
			ableToPlace = true
		}
	}
	
	ctx.stroke()
	
	for (const enemy of enemies) {
		let segPro = 0
		let segi = 0
		let seg = path.p[0]
		
		ctx.fillStyle = enemy.color
		ctx.fillRect(enemy.pos.x-enemy.size.x/2, enemy.pos.y-enemy.size.x/2, enemy.size.x, enemy.size.y)
	}
	
	let intersectingTower = false
	for (var i = towers.length-1; i>=0; i--) {
		let tower = towers[i]
		
		let size = new vector2(towerSize, towerSize)
		
		let mx = mousePos.x
		let my = mousePos.y

		ctx.fillStyle = tower.towerType.color
		ctx.roundRect(tower.pos.x-size.x/2, tower.pos.y-size.x/2, size.x, size.y, 5)
		
		if (ctx.isPointInPath(mx, my) && mouseDown == 1 && deleteMode) {
			towers.splice(towers.indexOf(tower), 1)
			money += tower.sellPrice
			deleteMode = false
		}
		
		let adjustedMP = new vector2(mx-canvas.width/2, (my-canvas.height/2))
		
		if (window.snap) {
			mx = Math.round((adjustedMP.x)/(snap))*(snap)
			my = Math.round((adjustedMP.y)/(snap))*(snap)
		}
		
		mx += canvas.width/2
		my += canvas.height/2
		
		if (placingTower) {
			if (ctx.isPointInPath(mx + towerSize/2, my + towerSize/2) || ctx.isPointInPath(mx + towerSize/2, my - towerSize/2) || ctx.isPointInPath(mx - towerSize/2, my + towerSize/2) || ctx.isPointInPath(mx - towerSize/2, my - towerSize/2) || ctx.isPointInPath(mx, my)) {
				intersectingTower = true
			}
		}
		ctx.fill()
	}
	ableToPlace = ableToPlace && !intersectingTower
	
	for (var i = renderQue.length-1; i>=0; i--) {
		let f = renderQue[i]
		
		if (f.frames == 0) {
			renderQue.splice(renderQue.indexOf(f), 1)
		} else {
			f.frames--
			f.func(cam, canvas, ctx, f.frames)
		}
	}
	
	if (placingTower) {
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, -cam.z)
		
		let mx = mousePos.x
		let my = mousePos.y
		
		let adjustedMP = new vector2(mx-canvas.width/2, ((my-canvas.height/2)*-1))
		
		if (window.snap) {
			adjustedMP.x = Math.round((adjustedMP.x)/(snap))*(snap)
			adjustedMP.y = Math.round((adjustedMP.y)/(snap))*(snap)
		}
		
		ctx.fillStyle = placingTT.color
		ctx.fillRoundRect(adjustedMP.x-towerSize/2, adjustedMP.y-towerSize/2, towerSize, towerSize, 5)
		if (ableToPlace) {
			ctx.fillStyle = "rgba(0, 255, 0, 0.25)"
		} else {
			ctx.fillStyle = "rgba(255, 0, 0, 0.25)"
		}
		ctx.beginPath()
		ctx.arc(adjustedMP.x, adjustedMP.y, placingTT.range, 0, 2 * Math.PI)
		ctx.closePath()
		ctx.fill()
	}
	
	// draw right gui
	ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
	ctx.scale(cam.z, -cam.z)
	ctx.fillStyle = "#52596b"
	ctx.fillRoundRect(c.width/2-300, -c.height/2, 600, c.height, 10)
	ctx.fillStyle = palette.wall
	ctx.fillRoundRect(c.width/2-275, -c.height/2+25, 600, c.height-50, 10)
	
	
	// draw money and health
	ctx.setTransform(1, 0, 0, 1, canvas.width-275/2, canvas.height/2)
	ctx.scale(cam.z, cam.z)
	
	ctx.font = "50px monospace"
	ctx.fillStyle = "red"
	let len = ctx.measureText(path.h)
	ctx.fillText(path.h, (275/4)-len.width/2, (canvas.height/2)-115)
	len = ctx.measureText(money)
	ctx.fillStyle = "green"
	ctx.fillText(money, -(275/4)-len.width/2, (canvas.height/2)-115)
	
	let tower = 0
	for (var i=0; i<4; i++) {
		let tt = towerTypes[i+((page-1)*4)]
		
		if (!tt) {
			break
		}
		
		if (!(!tt.hidden || window.cheats.showHiddenTowers)) {continue}
		
		ctx.setTransform(1, 0, 0, 1, canvas.width-(270/2), canvas.height/2)
		ctx.scale(cam.z, cam.z)
		
		ctx.fillStyle = "#52596b"
		ctx.fillRoundRect(-(buttonWidth+dif/2)/2, (-canvas.height/2+(-dif/2)+topMargin) + ((buttonGap+buttonHeight)*tower), buttonWidth, buttonHeight, 10)
		ctx.fillStyle = palette.wall
		if (placingTT == tt){
			ctx.fillStyle = "#6b5252"
		}
		ctx.roundRect(-(buttonWidth-dif/2)/2, (-canvas.height/2+topMargin) + ((buttonGap+buttonHeight)*tower), buttonWidth-dif, buttonHeight-dif, 10)
		ctx.fill()
		
		if (ctx.isPointInPath(mousePos.x, mousePos.y) && mouseDown == 1 && tt.price <= money && !placingTower && playing) {
			placingTower = true
			placingTT = tt
			deleteMode = false
		}
		
		ctx.setTransform(1, 0, 0, 1, (canvas.width-(270/2))-((buttonWidth+dif/2)/2), (canvas.height/2)+((-canvas.height/2+(-dif/2)+topMargin) + ((buttonGap+buttonHeight)*tower)))
		ctx.scale(cam.z, cam.z)
		
		ctx.fillStyle = "white"
		ctx.font = "30px monospace"
		let len = ctx.measureText(tt.name)
		ctx.fillText(tt.name, buttonWidth/2-len.width/2, 30)
		
		ctx.fillStyle = "green"
		if (tt.price > money) {
			ctx.fillStyle = "red"
		}
		ctx.font = "30px monospace"
		len = ctx.measureText(tt.price)
		ctx.fillText(tt.price, buttonWidth/2-len.width/2, 60)
		
		
		ctx.fillStyle = "#7a849e"
		ctx.font = "14px monospace"
		len = ctx.measureText(tt.desc)
		ctx.wrapText(tt.desc, buttonWidth/2, descDis, buttonWidth-20, 16)
		
		tower++
	}
	
	ctx.setTransform(1, 0, 0, 1, canvas.width-(275/2), canvas.height/2)
	ctx.scale(cam.z, cam.z)
	
	let buttonWidth3 = 40
	let buttonHeight3 = 40
	let topMargin3 = 30
	let dif3 = 5
	
	ctx.fillStyle = "#52596b"
	ctx.fillRoundRect(-(buttonWidth3+dif3/2)/2 + (275/4), (-canvas.height/2+(-dif3/2)+topMargin3), buttonWidth3, buttonHeight3, 5)
	ctx.fillStyle = palette.wall
	ctx.roundRect(-(buttonWidth3-dif3/2)/2 + (275/4), (-canvas.height/2+topMargin3), buttonWidth3-dif3, buttonHeight3-dif3, 5)
	if (ctx.isPointInPath(mousePos.x, mousePos.y) && mouseDown == 1 && !placingTower && playing && !onPageClick) {
		onPageClick = true
		page = (page+1).clamp(1, pages)
	}
	ctx.fill()
	
	ctx.fillStyle = "#52596b"
	ctx.fillRoundRect(-(buttonWidth3+dif3/2)/2 - (275/4), (-canvas.height/2+(-dif3/2)+topMargin3), buttonWidth3, buttonHeight3, 5)
	ctx.fillStyle = palette.wall
	ctx.roundRect(-(buttonWidth3-dif3/2)/2 - (275/4), (-canvas.height/2+topMargin3), buttonWidth3-dif3, buttonHeight3-dif3, 5)
	if (ctx.isPointInPath(mousePos.x, mousePos.y) && mouseDown == 1 && !placingTower && playing && !onPageClick) {
		onPageClick = true
		page = (page-1).clamp(1, pages)
	}
	ctx.fill()
	
	ctx.fillStyle = "#fff"
	ctx.font = "40px monospace"
	
	len = ctx.measureText("<")
	ctx.fillText("<", (-(buttonWidth3-dif3/2)/2 - (275/4)) + len.width/4, (-canvas.height/2+topMargin3) + 28)
	ctx.fillText(">", (-(buttonWidth3-dif3/2)/2 + (275/4)) + len.width/4, (-canvas.height/2+topMargin3) + 28)
	
	ctx.font = "50px monospace"
	
	len = ctx.measureText("1/3")
	ctx.fillText(page + "/" + pages, -(len.width/2), (-canvas.height/2+topMargin3) + 35)
	
	
	
	ctx.setTransform(1, 0, 0, 1, canvas.width-(270/2), canvas.height/2)
	ctx.scale(cam.z, cam.z)
	
	ctx.fillStyle = "#52596b"
	ctx.fillRoundRect(-(buttonWidth+dif/2)/2, (canvas.height/2-(dif/2)-topMargin2) - (buttonHeight2), buttonWidth, buttonHeight2, 10)
	ctx.fillStyle = palette.wall
	ctx.roundRect(-(buttonWidth-dif/2)/2, (canvas.height/2-topMargin2) - (buttonHeight2), buttonWidth-dif, buttonHeight2-dif, 10)
	if (ctx.isPointInPath(mousePos.x, mousePos.y) && mouseDown == 1 && !waveInProgress && playing) {
		startWave()
	}
	ctx.fill()
	
	ctx.font = "30px monospace"
	if (!waveInProgress) {
		ctx.fillStyle = "white"
	} else {
		ctx.fillStyle = "#52596b"
	}
	len = ctx.measureText("Start Wave " + (wave+1))
	ctx.fillText("Start Wave " + (wave+1), -len.width/2, canvas.height/2-(buttonHeight2+topMargin2+15)/2-3)
	
	let buttonWidth4 = 100
	ctx.fillStyle = "#52596b"
	ctx.fillRoundRect(-(buttonWidth4+dif/2)/2-220, (canvas.height/2-(dif/2)-topMargin2) - (buttonHeight2) + 30, buttonWidth4, buttonHeight2, 10)
	if (deleteMode) {
		ctx.fillStyle = "#6b5252"
	} else {
		ctx.fillStyle = palette.wall
	}
	ctx.roundRect(-(buttonWidth4-dif/2)/2-220, (canvas.height/2-topMargin2) - (buttonHeight2) + 30, buttonWidth4-dif, buttonHeight2-dif, 10)
	if (ctx.isPointInPath(mousePos.x, mousePos.y) && mouseDown == 1 && !waveInProgress && playing) {
		deleteMode = true
	}
	ctx.fill()
	
	ctx.font = "40px monospace"
	ctx.fillStyle = "#fff"
	len = ctx.measureText("Sell")
	ctx.fillText("Sell", -len.width/2-220, canvas.height/2-(buttonHeight2+topMargin2+15)/2+30)
	
	if (!playing) {
		ctx.setTransform(1, 0, 0, 1, canvas.width/2, canvas.height/2)
		ctx.scale(cam.z, cam.z)
		
		ctx.fillStyle = "rgba(128, 128, 128, 0.6)"
		ctx.fillRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
		
		ctx.fillStyle = "red"
		ctx.font = "60px monospace"
		len = ctx.measureText("Game Over!")
		ctx.fillText("Game Over!", -len.width/2, 0)
	}
}

function addToRenderQue(f, framesStay){
	renderQue.push({func: f, frames: framesStay})
}

window.cheats = {}
window.cheats.setWave = function(w) {
	wave = w
}
window.cheats.setMoney = function(m) {
	money = m
}
window.cheats.setLives = function(l) {
	path.h = l
}
window.cheats.killAll = function() {
	for (var i = enemies.length-1; i>=0; i--) {
		enemies.at(i).die()
	}
}
window.cheats.showHiddenTowers = false