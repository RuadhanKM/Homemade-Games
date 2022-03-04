function load() {
	var c = document.getElementById('c')
	var ctx = c.getContext('2d')
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	var player = new rect(-25, 0, 50, 100, "#e6a76c")
	var gun = new rect(player.x-10, player.y + 25, 80, 20, "#ffffff")
	
	var akTexture = new Image()
	akTexture.src = "https://cdn.yourpng.com/uploads/preview/ak-47-transparent-png-images-download-2-11618566722buvkc2egrb.png"
	
	const playerAccel = 0.2
	const playerDecel = 1.1
	const maxSpeed = 6
	const jumpPower = 15
	const fireRate = 140
	const bulletSpeed = 13
	
	var cp = [0, 0]
	
	var pressedKeys = {}
	window.onkeyup = function(e) { pressedKeys[e.keyCode] = false }
	window.onkeydown = function(e) { pressedKeys[e.keyCode] = true }
	
	const ground = new rect(-500, 200, 1000, 1000, '#3b414d')
	const rwall = new rect(500, -500, 1000, 3000, '#3b414d')
	const lwall = new rect(-1500, -500, 1000, 3000, '#3b414d')
	const midplat = new rect(-250, -60, 500, 50, '#3b414d')
	
	var enemies = []
	var kills = 0
	
	var lastShotSide = "left"
	const recoil = 9
	var curRecoil = 0
	var gunThrown = false
	const throwXSpeed = 14
	const throwYSpeed = 9
	const throwRotSpeed = 20
	var throwDirection = "left"
	
	var rects = [player, ground, rwall, lwall, midplat, gun]
	const maxAmmo = 30
	var playerAmmo = maxAmmo
	var reloading = false
	var paused = false
	const reloadSpeed = 1600
	
	var projectiles = []
	
	const grav = -0.4
	
	
	
	
	
	

	
	
	
	function lerp(a, b, x){
		return a + (b - a) * x
	}
	
	function updateTrownGuns() {
		gun.rot += throwRotSpeed
		if (throwDirection === "left") {
			gun.xVel = -throwXSpeed
			gun.collisions = false
			applyGravity(gun)
			gun.grounded = true
			updateMovement(gun)
		}
		if (throwDirection === "right") {
			gun.xVel = throwXSpeed
			gun.collisions = false
			applyGravity(gun)
			gun.grounded = true
			updateMovement(gun)
		}
		if (throwDirection === "up") {
			gun.xVel = 0
			gun.collisions = false
			applyGravity(gun)
			gun.grounded = true
			updateMovement(gun)
		}
	}
	
	function shoot(x, y, dirx, diry, shooter) {
		if (shooter.canShoot && playerAmmo > 0) {
			let proj = new rect(x, y, dirx*3+5, diry*3+5, "#fffcd9")
			
			if (shooter === player) {
				curRecoil += recoil
				playerAmmo -= 1
			}
			
			rects.push(proj)
			projectiles.push([proj, dirx, diry, shooter])
			
			shooter.canShoot = false
			setTimeout(function(){
				shooter.canShoot = true
			}, fireRate)
		} else if (playerAmmo === 0 && !reloading) {
			reloading = true
			gunThrown = true
			gun.yVel = throwYSpeed
			throwDirection = lastShotSide
			setTimeout(function(){
				reloading = false
				playerAmmo = maxAmmo
				gunThrown = false
				gun.x = player.x-15
				gun.y = player.y+25
				gun.rot = 0
			}, reloadSpeed)
		} 
	}
	
	function applyGravity(body) {
		if (body) {
			body.yVel += grav
			let colGrav = body.move(0, -body.yVel, body.collisions ? [ground, rwall, lwall, midplat] : [])
			body.grounded = false
			if (colGrav[0]){
				body.yVel = 0
				if (colGrav[1].y > body.y) {
					body.grounded = true
				}
			}
		}
	}
	
	function onDeath(){
		player = new rect(-25, 0, 50, 100, "#e6a76c")
		kills = 0
		playerAmmo = maxAmmo
		enemies = []
		rects = [player, ground, rwall, lwall, midplat, gun]
		projectiles = []
	}
	
	function updateProjectiles() {
		for (const proj of projectiles) {
			if (proj) {
				let projHit = proj[0].move(proj[1], proj[2], [rwall, lwall, ground, midplat, player, ...enemies])
				
				if (enemies.includes(projHit[1]) && proj[3] === player){
					delete rects[rects.indexOf(projHit[1])]
					delete enemies[enemies.indexOf(projHit[1])]
					
					kills += 1
				}
				else if (projHit[1] === player){
					onDeath()
				}
				
				if (projHit[0]) {
					delete rects[rects.indexOf(proj[0])]
					delete projectiles[projectiles.indexOf(proj)]
				}
			}
		}
	}
	
	function handleCommmands(body, command){
		if (body) {	
			if (command === "move left"){
				body.xVel -= playerAccel
				if (body.xVel > 0){
					body.xVel = 0
				}
			}
			if (command === "move right"){
				body.xVel += playerAccel
				if (body.xVel < 0){
					body.xVel = 0
				}
			}
			
			if (command === "jump" && body.grounded){
				body.yVel = jumpPower
			}
			if (command === "shoot left"){
				shoot(body.x, body.y+30, -bulletSpeed, 0, body)
			}
			if (command === "shoot right"){
				shoot(body.x+body.xSize, body.y+30, bulletSpeed, 0, body)
			}
			if (command === "shoot up"){
				shoot(body.x+25, body.y+30, 0, -bulletSpeed, body)
			}
		}
	}
	
	function handleInputs(){
		if (pressedKeys["65"]) {
			handleCommmands(player, "shoot left")
			lastShotSide = "left"
		}
		if (pressedKeys["68"]) {
			handleCommmands(player, "shoot right")
			lastShotSide = "right"
		}
		if (pressedKeys["87"]) {
			handleCommmands(player, "shoot up")
			lastShotSide = "up"
		}
		if (pressedKeys["37"]) {
			handleCommmands(player, "move left")
			player.moving = true
		}
		else if (pressedKeys["39"]) {
			handleCommmands(player, "move right")
			player.moving = true
		}
		else {
			player.moving = false
		}
		if (pressedKeys["38"]) {
			handleCommmands(player, "jump")
		}
		if (pressedKeys["27"]) {
			paused = !paused
		}
	}
	
	function updateMovement(body){
		if (body) {
			if (body.grounded && !body.moving){
				body.xVel /= playerDecel
			}
			
			let clampedXvel = Math.min(Math.max(body.xVel, -maxSpeed), maxSpeed)
			body.move(clampedXvel, 0, body.collisions ? [ground, rwall, lwall, midplat] : [])
		}
	}
	
	function generateAi(){
		let right = Math.random() >= 0.5
		
		let enemy
		if (right){
			enemy = new rect(500, -600, 50, 100, "#8997b3")
		} else {
			enemy = new rect(-550, -600, 50, 100, "#8997b3")
		}
		enemies.push(enemy)
		rects.push(enemy)
		
		setTimeout(function(){
			generateAi()
		}, Math.max(2000*(1-(kills/30)), 600))
	}
	
	generateAi()
	
	
	
	
	
	
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		handleInputs()
		updateProjectiles()
		updateMovement(player)
		applyGravity(player)
		
		for (var i = 0; i < enemies.length; i++){
			if (enemies[i]) {
				let curAiMove = updateAI(player, enemies[i], projectiles)
				for (const command of curAiMove) {
					handleCommmands(enemies[i], command)
				}
				
				enemies[i].moving = (curAiMove.includes("move left") || curAiMove.includes("move right"))
				
				updateMovement(enemies[i])
				applyGravity(enemies[i])
			}
		}
		
		
		cp[0] = lerp(cp[0], -player.x-25, 0.08)
		cp[1] = lerp(cp[1], -player.y, 0.08)
		
		if (!gunThrown) {
			curRecoil = lerp(curRecoil, 0, 0.04)
			let curGunX = lastShotSide === "left" ? -50 + curRecoil : 50 - curRecoil
			
			if (lastShotSide === "up"){
				gun.rot = lerp(gun.rot, 90, 0.4)
				
				gun.x = lerp(gun.x, player.x-15, 0.45)
				gun.y = lerp(gun.y, player.y + -15 + curRecoil, 0.45)
			}
			else if (lastShotSide === "left"){
				gun.rot = lerp(gun.rot, 0, 0.4)
				gun.x = lerp(gun.x, (player.x-15)+curGunX, 0.45)
				gun.y = lerp(gun.y, player.y + 25, 0.45)
			}
			else if (lastShotSide === "right"){
				gun.rot = lerp(gun.rot, 180, 0.4)
				gun.x = lerp(gun.x, (player.x-15)+curGunX, 0.45)
				gun.y = lerp(gun.y, player.y + 25, 0.45)
			}
		} else {
			updateTrownGuns()
		}
		
		
		
		if (player.y > c.height) {
			player.x = -25
			player.y = 0
			player.yVel = 0
			player.xVel = 0
		}
		
		for (const rect of rects){
			if (rect) {
				ctx.translate((rect.x+rect.xSize/2) + cp[0] + c.width/2, (rect.y+rect.ySize/2) + cp[1] + c.height/2)
				ctx.rotate(rect.rot * Math.PI / 180)
				ctx.translate(-((rect.x+rect.xSize/2) + cp[0] + c.width/2), -((rect.y+rect.ySize/2) + cp[1] + c.height/2))
				ctx.fillStyle = rect.color
				if (rect.texture) {
					ctx.drawImage(rect.texture, (rect.x+cp[0])+c.width/2, (rect.y+cp[1])+c.height/2, rect.xSize, rect.ySize)
				} else {
					ctx.fillRect((rect.x+cp[0])+c.width/2, (rect.y+cp[1])+c.height/2, rect.xSize, rect.ySize)
				}
				ctx.fillStyle = 'black'
				ctx.setTransform(1, 0, 0, 1, 0, 0)
			}
		}
		ctx.fillStyle = '#eeaaaa'
		ctx.font = '30px monospace'
		ctx.fillText(playerAmmo.toString(), cp[0] + c.width/2 + player.x + 25 - ctx.measureText(playerAmmo.toString()).width/2, player.y + cp[1] + c.height/2 - 10)
		ctx.fillStyle = '#aaeeaa'
		ctx.fillText(kills.toString(), cp[0] + c.width/2 + player.x + 25 - ctx.measureText(kills.toString()).width/2, player.y + cp[1] + c.height/2 - 40)
		
		requestAnimationFrame(main)
	}
	
	main()
}

window.addEventListener('load', load)