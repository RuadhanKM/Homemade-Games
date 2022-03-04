function load() {
	var c = document.getElementById("c")
	var ctx = c.getContext('2d')
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	
	const start = new vector2(-525, 125)
	const health = 20
	const pathWidth = 100
	
	const cam = new vector3(0, 0, 1)
	
	new Path([
		new vector2(200, 0),
		new vector2(0, -200),
		new vector2(500, 0),
		new vector2(0, 200),
		new vector2(-200, 0),
		new vector2(0, -400)
	], pathWidth, palette.wall, start, health)
	
	new towerType(
		100, //price
		"#e68e30", //color
		"Shooter", //name
		225, //range
		625, //fire rate
		50, //cost inc
		"A cheap, general purpose tower.", // desc
		
		function(target, thisTower, enemies, towers){
			if (!target) {return}
			
			target.health -= 10
			const hitPos = new vector2(target.pos.x, target.pos.y)
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)
				
				ctx.strokeStyle = "rgba(255, 255, 0, " + (0.8*(frame/8)).toString() + ")"
				ctx.lineWidth = 2
				
				ctx.beginPath()
				ctx.moveTo(thisTower.pos.x, thisTower.pos.y)
				ctx.lineTo(hitPos.x, hitPos.y)
				ctx.stroke()
			}, 8)
			
			if (target.health <= 0) {
				target.die()
			}
		}
	)
	
	new towerType(
		300, //price
		"#e63030", //color
		"Sploder", //name
		175, //range
		2000, //fire rate
		100, //cost inc
		"Good at dealing with large swarms of enemies.", // desc
		
		function(target, thisTower, enemies, towers){
			if (!target) {return}
		
			let rad = 60
			let dammage = 18
			
			const hitPos = new vector2(target.pos.x, target.pos.y)
			
			for (var i = enemies.length-1; i>=0; i--) {
				let enemy = enemies.at(i)
				
				if (enemy == target) {continue}
				if (hitPos.disTo(enemy.pos) < rad) {
					enemy.health -= dammage
				}
				
				if (enemy.health <= 0) {
					enemy.die()
				}
			}
			
			target.health -= dammage
			if (target.health <= 0) {
				target.die()
			}
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)

				ctx.beginPath()
				ctx.arc(hitPos.x, hitPos.y, rad, 0, 2 * Math.PI)
				ctx.fillStyle = "rgba(255, 255, 0, " + (0.35*(frame/12)).toString() + ")"
				ctx.fill()
			}, 12)
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)
				
				ctx.strokeStyle = "rgba(255, 255, 0, " + (0.15*(frame/8)).toString() + ")"
				ctx.lineWidth = 5
				
				ctx.beginPath()
				ctx.moveTo(thisTower.pos.x, thisTower.pos.y)
				ctx.lineTo(hitPos.x, hitPos.y)
				ctx.stroke()
			}, 8)
		}
	)
	
	new towerType(
		525, //price
		"#e6cd30", //color
		"Sniper", //name
		325, //range
		5250, //fire rate
		350, //cost inc
		"Good for single, high-health enemies.", // desc
		
		function(target, thisTower, enemies, towers){
			if (!target) {return}
			
			target.health -= 1500
			const hitPos = new vector2(target.pos.x, target.pos.y)
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)
				
				ctx.strokeStyle = "rgba(255, 255, 0, " + (1*(frame/50)).toString() + ")"
				ctx.lineWidth = 4
				
				ctx.beginPath()
				ctx.moveTo(thisTower.pos.x, thisTower.pos.y)
				ctx.lineTo(hitPos.x, hitPos.y)
				ctx.stroke()
			}, 50)
			
			if (target.health <= 0) {
				target.die()
			}
		}
	)
	
	new towerType(
		750, //price
		"#a9d4d3", //color
		"Slower", //name
		150, //range
		9000, //fire rate
		250, // cost inc
		"Slows down enemies, but does no dammage by itself.", // desc
		
		function(target, thisTower, enemies, towers){
			if (!target) {return}
			
			const hitPos = new vector2(target.pos.x, target.pos.y)
			const rad = 100
			const slow = 0.3
			const time = 2

			for (var i = enemies.length-1; i>=0; i--) {
				let enemy = enemies.at(i)

				if (hitPos.disTo(enemy.pos) < rad) {
					enemy.speed *= slow
					
					setTimeout(function(){
						enemy.speed /= slow
					}, time*1000)
				}
			}
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)

				ctx.beginPath()
				ctx.arc(hitPos.x, hitPos.y, rad, 0, 2 * Math.PI)
				ctx.fillStyle = "rgba(180, 180, 255, " + (0.35*(frame/180)).toString() + ")"
				ctx.fill()
			}, 180)
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)
				
				ctx.strokeStyle = "rgba(180, 180, 255, " + (0.4*(frame/100)).toString() + ")"
				ctx.lineWidth = 4
				
				ctx.beginPath()
				ctx.moveTo(thisTower.pos.x, thisTower.pos.y)
				ctx.lineTo(hitPos.x, hitPos.y)
				ctx.stroke()
			}, 100)
		}
	)
	
	new towerType(
		2500, //price
		"#80e800", //color
		"Shredder", //name
		200, //range
		30, //fire rate
		1000, // cost inc
		"Mowes down enemies with a high firerate.", // desc
		
		function(target, thisTower, enemies, towers){
			if (!target) {return}
			
			target.health -= 15
			const hitPos = new vector2(target.pos.x, target.pos.y)
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)
				
				ctx.strokeStyle = "rgb(255, 255, 0)"
				ctx.lineWidth = 1
				
				ctx.beginPath()
				ctx.moveTo(thisTower.pos.x, thisTower.pos.y)
				ctx.lineTo(hitPos.x, hitPos.y)
				ctx.stroke()
			}, 1)
			
			if (target.health <= 0) {
				target.die()
			}
		}
	)
	
	new towerType(
		1000, //price
		"#cc66aa", //color
		"Speeder", //name
		75, //range
		2000, //fire rate
		5000, // cost inc
		"Increases firerate of nearby towers.", // desc
		
		function(target, thisTower, enemies, towers){
			const hitPos = new vector2(thisTower.pos.x, thisTower.pos.y)
			const rad = 75
			const speed = 2
			const time = 1.25

			for (var i = towers.length-1; i>=0; i--) {
				let tower = towers.at(i)
				
				if (tower.towerType == this) {continue}

				if (hitPos.disTo(tower.pos) < rad) {
					tower.towerType.fireRate /= speed
					
					setTimeout(function(){
						tower.towerType.fireRate *= speed
					}, time*1000)
				}
			}
			
			addToRenderQue(function(cam, c, ctx, frame){
				ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
				ctx.scale(cam.z, -cam.z)

				ctx.beginPath()
				ctx.arc(hitPos.x, hitPos.y, rad, 0, 2 * Math.PI)
				ctx.fillStyle = "rgba(255, 180, 200, " + (0.8*(frame/2000)).toString() + ")"
				ctx.fill()
			}, 180)
		},
		
		false, // only fire if enemy is avaliable
		true // hidden
	)
	
	new nbButton("Save", save)
	new nbButton("Load", loadSave)
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		miscMain()
		render(cam, c, ctx)
		
		requestAnimationFrame(main)
	}
	
	main()
}

window.addEventListener('load', load)