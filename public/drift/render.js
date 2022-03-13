function render(poly) {
	ctx.setTransform(1, 0, 0, 1, c.width/2, c.height/2)
	ctx.scale(cam.z, -cam.z)
	ctx.translate(-cam.x, -cam.y)
	
	ctx.fillStyle = poly.color
	
	ctx.beginPath()
	ctx.moveTo(poly.verts[0].x, poly.verts[0].y)
	
	for (const vert of poly.verts.slice(1)) {
		ctx.lineTo(vert.x, vert.y)
	}
	
	ctx.closePath()
	ctx.stroke()
	ctx.fill()
}