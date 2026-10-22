const cols_height = [0,0,0,0,0,0,0]
var player = true
Array.from(document.getElementsByClassName("col")).forEach(target => {
	target.addEventListener('click',()=>{
		const col_num = target.getAttribute('id').slice(3);
		const col_idx = Number(col_num) - 1;
		const cell = document.getElementById(String(6 - cols_height[col_idx]) + col_num);
		const piece = document.createElement('img');
		if (player){
			piece.src = 'assets/red.png';
			document.getElementById('turn').textContent = "AI turn...";
		}
		else{
			piece.src = 'assets/yellow.png';
			document.getElementById('turn').textContent = "your turn...";
		}
		player = !player;
		piece.className = 'piece';
		cell.appendChild(piece);
		cols_height[col_idx] += 1;
	});
});
