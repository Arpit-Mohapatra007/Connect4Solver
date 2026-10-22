const board = Array.from({ length: 6}, ()=> Array(7).fill('.'));
var cols_height = [0,0,0,0,0,0,0];
const controller = new AbortController();
const { signal } = controller;

Array.from(document.getElementsByClassName("col")).forEach(target => {
	target.addEventListener('click', async ()=>{
		const col_num = target.getAttribute('id').slice(3);
		const col_idx = Number(col_num) - 1;
		const cell = document.getElementById(String(6 - cols_height[col_idx]) + col_num);
		const piece = document.createElement('img');
		piece.src = 'assets/red.png';
		document.getElementById('turn').textContent = "AI turn...";
		piece.className = 'piece';
		cell.appendChild(piece);
		const response = await fetch('https://connect4solver.onrender.com/api',{
			method: 'POST',
			headers: {
				'Content-Type':'application/json'
			},
			body: JSON.stringify({
				'col_num': Number(col_num),
				'board': board
			})
		});
		const result = await response.json();
		if (result["status"] == 200){
			const rh = result["human_piece"][0];
			const ch = result["human_piece"][1];
			board[rh][ch] = 'R';
			cols_height = result["cols_height_human"];
			if (result["game_status"] == -1){
				const ra = result["ai_piece"][0];
				const ca = result["ai_piece"][1];
				cols_height = result["cols_height_ai"];
				const cell_2 = document.getElementById(String(7 - cols_height[ca]) + String(ca + 1));
				const piece_2 = document.createElement('img');
				piece_2.src = 'assets/yellow.png';
				piece_2.className = 'piece';
				cell_2.appendChild(piece_2);
				board[ra][ca] = 'Y';
				switch(result["game_status_now"]){
					case -1:
						document.getElementById('turn').textContent = "Your turn...";
						break;
					case 0:
						document.getElementById('turn').textContent = "DRAW";
						controller.abort();
						break;	
					case 1:
						document.getElementById('turn').textContent = "You WON !!";
						controller.abort();
						break;
					case 2:
						document.getElementById('turn').textContent = "AI WON !!";
						controller.abort();
						break;
				}
			} else {
				document.getElementById('turn').textContent = "You WON !!";
				controller.abort();
			}
		} else {
			switch(result["status"]){
				case 601:
					console.log("Column is Full !!");
					break;
				case 602:
					console.log("Invalid move !!");
					break;
				case 603:
					console.log("Board is corrupted !!");
					break;
				case 604:
					console.log("Board is full !! Restart by reload !!");
					break;
				case 605:
					console.log("Assymetric Count of Pieces !!");
					break;
				case 606:
					console.log("Game is already over !!");
					break;				
			}
			cell.removeChild(piece);
		}
	}, { signal });
});
