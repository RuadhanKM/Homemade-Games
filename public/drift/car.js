var pressedKeys = {}
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true }

class car {
	constructor(settings) {
		// 10 pixles = 1 meter
		
		this.settings = settings
		this.hitbox = new poly
		(
			[
				{'x': 20, 'y': 40},
				{'x': 20, 'y': -40},
				{'x': -20, 'y': -40},
				{'x': -20, 'y': 40}
			],
			
			{'x': 0, 'y': 0}
		)
		
		this.velocity = {'x': 0, 'y': 0}
		this.angularVelocity = 10
		this.steeringAngle = 0
	}
	
	get heading() {
		return {'x': Math.cos(rad(this.hitbox.rotation+90)), 'y': Math.sin(rad(this.hitbox.rotation+90))}
	}
	
	update(dt) {
		dt = 0.016
		
		//
		// Car sim based off of https://asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
		// (this was actually a life saver, awesome paper)
		//
		
		var F_traction = {'x': 0, 'y': 0}
		var F_breaking = {'x': 0, 'y': 0}
		
		if (pressedKeys['87']) { // W
			F_traction = mults(this.heading, this.settings.Engineforce)
		}
		if (pressedKeys['83']) { // S
			F_traction = mults(this.heading, -this.settings.Engineforce)
		}
		if (pressedKeys['65']) { // A
			this.steeringAngle = Math.min(this.steeringAngle + (this.settings.TurnSpeed * dt), this.settings.MaxTurn)
		}
		if (pressedKeys['68']) { // D
			this.steeringAngle = Math.max(this.steeringAngle - (this.settings.TurnSpeed * dt), -this.settings.MaxTurn)
		}
		if (!pressedKeys['65'] && !pressedKeys['68']) {
			this.steeringAngle += dt * (this.steeringAngle > 0 ? -this.settings.TurnSpeed : this.settings.TurnSpeed)
			this.steeringAngle = (Math.abs(this.steeringAngle) < 2) ? 0 : this.steeringAngle
		}
		
		var absSteeringAngle = this.hitbox.rotation + this.steeringAngle
		
		var F_lateral = mults({'x': Math.cos(rad(absSteeringAngle+90)), 'y': Math.sin(rad(absSteeringAngle+90))}, this.settings.C_corneringStiffness)
		var sideslipAngle = Math.atan(this.velocity.y / this.velocity.x)
		
		var F_drag = mults(mults(this.velocity, -this.settings.C_drag), mag(this.velocity))
		var F_rollingResistance = mults(this.velocity, -this.settings.C_rollingResistance)
		var F_long = addv(addv(F_traction, F_drag), F_rollingResistance)
		
		var F = addv(F_long, F_lateral)
		
		var accel = divs(F, this.settings.Mass)
		this.velocity = addv(this.velocity, mults(accel, dt))

		this.hitbox.pos = addv(this.hitbox.pos, mults(this.velocity, dt))
		this.hitbox.rotation += this.angularVelocity * dt
		render(this.hitbox)
	}
}