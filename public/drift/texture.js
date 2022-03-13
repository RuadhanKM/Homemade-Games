class poly{
	constructor(vertsRaw, pos, color="#fff") {
		this.vertsRaw = vertsRaw
		this.pos = pos
		this.color = color
		
		this.scale = 1
		this.rotation = 0
	}
	
	get verts() {
		let verts = []
		for (const vertRaw of this.vertsRaw) {
			let vert = vertRaw
			
			if (this.rotation != 0) {
				vert = {
					'x': vert.x * Math.cos(rad(this.rotation)) - vert.y * Math.sin(rad(this.rotation)),
					'y': vert.y * Math.cos(rad(this.rotation)) + vert.x * Math.sin(rad(this.rotation))
				}
			}
			vert = mults(vert, this.scale)
			vert = addv(vert, this.pos)
			
			verts.push(vert)
		}
		return verts
	}
	
	get axes() {
		var a = []
		
		for (var i = 0; i < this.verts.length; i++) {
			let p1 = this.verts[i]
			let p2 = this.verts[(i+1) % this.verts.length]
			let edge = subv(p1, p2)
			let normal = {'x': -edge.y, 'y': edge.x}

			a.push(unit(normal))
		}
		
		return a
	}
	
	getFurthestVert() {
		var f = this.verts[0]
		
		for (const vert of this.verts) {
			let v = subv(vert, this.pos)
			let ov = subv(f, this.pos)
			if (mag(v) > mag(ov)) {
				f = v
			}
		}
		
		return f
	}
	
	checkCol(other) {
		//
		// Separating Axis Theorem, based off https://dyn4j.org/2010/01/sat/
		//
		
		if (this.bbSize && other.bbSize) {
			if (mag(subv(this, other)) > this.bbSize + other.bbSize) {
				return false
			}
		}
		
		var axes1 = this.axes
		var axes2 = other.axes
		
		for (const axis of axes1) {
			let p1 = project(axis, this)
			let p2 = project(axis, other)
			if (!overlap(p1, p2)) {
				return false
			}
		}
		for (const axis of axes2) {
			let p1 = project(axis, this)
			let p2 = project(axis, other)
			if (!overlap(p1, p2)) {
				return false
			}
		}

		return true
	}
}