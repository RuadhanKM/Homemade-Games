class nbButton{
	constructor(name, func){
		let b = document.createElement("button")
		b.className = "other"
		b.onclick = func
		b.innerHTML = name
		
		var checkExist = setInterval(function() {
			if (document.getElementById("navbar")) {
				document.getElementById("navbar").appendChild(b)
				clearInterval(checkExist)
			}
		}, 100)
	}
}

class nbText{
	constructor(name, targetVar){
		let t = document.createElement("input")
		t.type = "text"
		t.placeholder = name
		t.className = "other"
		this.value = ""
		let a = this
		t.addEventListener('input', function(e) {
			a.value = e.target.value
		})
		
		var checkExist = setInterval(function() {
			if (document.getElementById("navbar")) {
				document.getElementById("navbar").appendChild(t)
				clearInterval(checkExist)
			}
		}, 100)
	}
}

function back(){
	location.href = "../index.html"
}

new nbButton("Back", back)

// palette
const palette = {}
palette.wall = "#3b414d"
palette.background = "#282c34"