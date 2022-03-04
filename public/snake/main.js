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
	
	var lastDirection = "right"
	var direction = undefined
	var pos = {}
	pos.x = 2
	pos.y = 4
	
	var apos = {}
	apos.x = 5
	apos.y = 4
	
	const speed = 250
	const boardSize = 600
	const tiles = 9
	const playerSize = 0.8
	const appleSize = 0.8
	const colorSeperation = 2
	
	var moves = []
	var occupied = []
	var segments = 1
	
	function updatePosition() {
		lastDirection = direction
		
		if (lastDirection == "right") {
			pos.x += 1
			moves.push("right")
		}
		if (lastDirection == "left") {
			pos.x -= 1
			moves.push("left")
		}
		if (lastDirection == "up") {
			pos.y += 1
			moves.push("up")
		}
		if (lastDirection == "down") {
			pos.y -= 1
			moves.push("down")
		}
		
		if (pos.x == apos.x && pos.y == apos.y) {
			segments++
			let randX = Math.floor(Math.random() * tiles)
			let randY = Math.floor(Math.random() * tiles)
			
			let rp = {}
			rp.x = randX
			rp.y = randY
			
			let occ = false
			
			while (true) {
				randX = Math.floor(Math.random() * tiles)
				randY = Math.floor(Math.random() * tiles)
				
				rp.x = randX
				rp.y = randY
				
				occ = false
				
				for (const occpos of occupied) {
					if (occpos.x == randX && occpos.y == randY) {
						occ = true
					}
				}
				
				if (!occ && !(rp == apos)) {
					break
				}
			}
			
			apos = rp
		}
		
		if ((pos.x >= tiles || pos.x < 0 || pos.y >= tiles || pos.y < 0)) {
			gameOver()
		}
	}
	
	function gameOver () {
		pos.x = 2
		pos.y = 4
		
		apos.x = 5
		apos.y = 4
		
		segments = 1
		
		lastDirection = "right"
		direction = undefined
		moves = []
	}
	
	setInterval(updatePosition, speed)
	
	window.onkeydown = function(e) {
		if (e.key === "ArrowRight" && lastDirection != "left") {
			direction = "right"
		}
		if (e.key === "ArrowLeft" && lastDirection != "right") {
			direction = "left"
		}
		if (e.key === "ArrowUp" && lastDirection != "down") {
			direction = "up"
		}
		if (e.key === "ArrowDown" && lastDirection != "up") {
			direction = "down"
		}
	}
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
		ctx.scale(1, -1)
		
		let scale = boardSize/tiles
		
		ctx.fillStyle = "#335533"
		ctx.fillRoundRect(-boardSize/2 - 10, -boardSize/2 - 10, boardSize + 20, boardSize + 20, 10)
		ctx.fillStyle = "#558855"
		ctx.fillRoundRect(-boardSize/2, -boardSize/2, boardSize, boardSize, 10)
		
		for (var x = 0; x < tiles; x ++) {
			for (var y = 0; y < tiles; y++) {
				if (y % 2 === x % 2) {
					ctx.fillStyle = "#66aa66"
					ctx.fillRect(x * scale - boardSize/2, y * scale - boardSize/2, scale, scale)
				}
			}
		}
		
		occupied = []
		
		for (var i = 0; i<segments; i++) {
			ctx.fillStyle = "hsl(120 80% " + (80 - colorSeperation*i) + "%)"
			
			let size = scale * playerSize
			let cpos = {}
			cpos.x = pos.x
			cpos.y = pos.y
			
			for (var e = 0; e<i; e++) {
				let move = moves.at(-e-1)
				
				if (move == "right") {
					cpos.x -= 1
				}
				if (move == "left") {
					cpos.x += 1
				}
				if (move == "up") {
					cpos.y -= 1
				}
				if (move == "down") {
					cpos.y += 1
				}
			}
			
			occupied.push(cpos)
			
			if (pos.x == cpos.x && pos.y == cpos.y && i > 1) {
				gameOver()
			}
			
			ctx.fillRoundRect((cpos.x*scale-boardSize/2) + (scale/2-size/2), (cpos.y*scale-boardSize/2) + (scale/2-size/2), size, size, 10)
		}
		
		let size = scale * appleSize
		ctx.fillStyle = "#ee5555"
		ctx.fillRoundRect((apos.x*scale-boardSize/2) + (scale/2-size/2), (apos.y*scale-boardSize/2) + (scale/2-size/2), size, size, 10)
		
		requestAnimationFrame(main)
	}
	
	main()
}

window.addEventListener('load', load)