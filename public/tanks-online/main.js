function load() {
	var c = document.getElementById("c")
	var ctx = c.getContext('2d')
	c.width = window.innerWidth
	c.height = window.innerHeight
	
	let cam = {}
	cam.x = 0
	cam.y = 0
	cam.z = 0.5
	
	const params = new Proxy(new URLSearchParams(window.location.search), {
		get: (searchParams, prop) => searchParams.get(prop),
	})
	
	function copyToClipboard(textToCopy) {
		// navigator clipboard api needs a secure context (https)
		if (navigator.clipboard && window.isSecureContext) {
			// navigator clipboard api method'
			return navigator.clipboard.writeText(textToCopy);
		} else {
			// text area method
			let textArea = document.createElement("textarea");
			textArea.value = textToCopy;
			// make the textarea out of viewport
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			textArea.style.top = "-999999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			return new Promise((res, rej) => {
				// here the magic happens
				document.execCommand('copy') ? res() : rej();
				textArea.remove();
			});
		}
	}
	
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
			
			new nbButton("Copy link", function(){
				copyToClipboard(window.location.hostname + "/tonl?ip=" + message.data.ip)
			})
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
			playing = true
			main()
		}
		if (message.prot == "update") {
			oplay = JSON.parse(message.data.player)
			
			other.pos = oplay.pos
			other.moveAngle = oplay.moveAngle
			other.lookAngle = oplay.lookAngle
		}
		if (message.prot == "shoot") {
			other.shoot(false, message)
		}
		if (message.prot == "kill") {
			var tankToKill = message.data.tank == "1" ? other : player
			
			tankToKill.visable = false
		}
		if (message.prot == "close") {
			instTextColor = "red"
			instText = "Opponent left!"
			
			setTimeout(() => {window.location.href = window.location.pathname}, 1000)
		}
		
		
		
		if (message.prot == "error") {
			instTextColor = "red"
			instText = message.data.message
			
			setTimeout(() => {window.location.href = window.location.pathname}, 1000)
		}
	}
	
	ws.addEventListener('open', function(){
		ws.addEventListener('message', messageHandler)
		
		if (params.ip) {
			connect()
		}
		
		ws.addEventListener('close', function(){
			instTextColor = "red"
			instText = "Lost connection to server!"
			
			setTimeout(() => {window.location.href = window.location.pathname}, 1000)
		})
	})
	
	var ip = new nbText("IP")
	
	function connect(){
		if (chosen) {return}
		
		hosting = false
		chosen = true
		
		let mes = {}
		mes.prot = "setup"
		mes.data = {}
		mes.data.hosting = false
		
		if (params.ip) {
			mes.data.host = params.ip
		} else {
			mes.data.host = ip.value
		}

		instText = "..."
		
		ws.send(JSON.stringify(mes))
	}
	var connectButton = new nbButton("Connect", connect)
	
	var hostButton = new nbButton("Host", function(){
		if (chosen) {return}
		
		hosting = true
		chosen = true
		ip.textArea.remove()
		connectButton.button.remove()
		hostButton.button.remove()
		
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
		render(cam, c, ctx, instText, instTextColor)
		requestAnimationFrame(main)
	}
}

window.addEventListener('load', load)