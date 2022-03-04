class rect{
	constructor(x, y, xSize, ySize, color, rot){
		this.x = x
		this.y = y
		this.xSize = xSize
		this.ySize = ySize
		this.color = color
		this.rot = 0
		this.yVel = 0
		this.xVel = 0
		this.grounded = false
		this.canShoot = true
		this.moving = false
		this.texture = undefined
		this.collisions = true
	}
	
	move(x, y, colliders){
		let rLeft = this.x + x
		let rRight = this.x + x + this.xSize
		let rUp = this.y + y
		let rDown = this.y + y + this.ySize 
		
		for (const col of colliders){
			if (col && col !== this) {
				let cLeft = col.x
				let cRight = col.x + col.xSize
				let cUp = col.y
				let cDown = col.y + col.ySize 
				
				if (rLeft < cRight && rRight > cLeft && rUp < cDown && rDown > cUp) {
					return [true, col]
				}
			}
		}

		this.x += x
		this.y += y
		return [false, null]
	}
}