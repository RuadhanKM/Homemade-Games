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
	
	const ws = new WebSocket("ws://"+window.location.hostname+":6969")
	
	var instText = "Use nav bar to join or create a game"
	var instTextColor = "#ffffff"
	
	var player
	var other
	
	var hosting = false
	var chosen = false
	var playing = false
	
	if (!localStorage.getItem("map")) {
		var map = deafult
	} else {
		var map = window.localStorage.getItem("map")
	}
	
	function messageHandler(e) {
		let message = JSON.parse(e.data)
		
		if (message.prot == "setup" && message.data.ip) {
			instText = "Server live at " + message.data.ip
		}
		if (message.prot == "setup" && message.data.start) {
			instText = "..."
			if (message.data.map) {map = message.data.map}
			for (const mtank of JSON.parse(map).tanks) {
				let mplayer = new tank(mtank.pos.x, mtank.pos.y, mtank.color)
				mplayer.pid = mtank.pid
				mplayer.moveRotSpeed = moveRotSpeed
				mplayer.speed = speed
				
				if ((hosting && mtank.pid == 1) || (!hosting && mtank.pid == 2)) {
					player = mplayer
				}
				if ((hosting && mtank.pid == 2) || (!hosting && mtank.pid == 1)) {
					other = mplayer
				}
			}
			for (const mwall of JSON.parse(map).walls) {
				new wall(mwall.pos.x, mwall.pos.y, mwall.size.x, mwall.size.y)
			}
			instText = ""
			playing = true;
			main()
		}
		if (message.prot == "update") {
			oplay = JSON.parse(message.data.player)
			
			other.pos = oplay.pos
			other.moveAngle = oplay.moveAngle
			other.lookAngle = oplay.lookAngle
		}
		if (message.prot == "shoot") {
			let bullet = other.shoot(false, message)
		}
		
		if (message.prot == "error") {
			instTextColor = "red"
			instText = message.data.message
			setTimeout(() => {window.location.reload()}, 1000)
		}
	}
	
	ws.addEventListener('open', function(){
		ws.addEventListener('message', messageHandler)
	})
	
	var ip = new nbText("IP")
	new nbButton("Connect", function(){
		if (chosen) {return}
		
		hosting = false
		chosen = true
		
		let mes = {}
		mes.prot = "setup"
		mes.data = {}
		mes.data.hosting = false
		mes.data.host = ip.value
		
		instText = "..."
		
		ws.send(JSON.stringify(mes))
	})
	new nbButton("Host", function(){
		if (chosen) {return}
		
		hosting = true
		chosen = true
		
		let mes = {}
		mes.prot = "setup"
		mes.data = {}
		mes.data.hosting = true
		mes.data.map = map
		
		instText = "..."
		
		ws.send(JSON.stringify(mes))
	})
	
	cam = JSON.parse(map).cam
	
	function renderInstructions() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)	

		render(cam, c, ctx, instText, instTextColor)
		
		if (!playing) {
			requestAnimationFrame(renderInstructions)
		}
	}
	renderInstructions()
	
	function main() {
		c.width = window.innerWidth
		c.height = window.innerHeight
		ctx.clearRect(0, 0, c.width, c.height)
		
		player.userInput(playing)
		
		let message = {}
		message.prot = "update"
		message.data = {}
		message.data.hosting = hosting
		message.data.player = JSON.stringify(player)
		ws.send(JSON.stringify(message))
		
		if (playing) {
			miscMain(hosting, ws)
		}
		render(cam, c, ctx)
		requestAnimationFrame(main)
	}
}

window.addEventListener('load', load)