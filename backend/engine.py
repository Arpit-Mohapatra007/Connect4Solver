def check_winner(r,c,board):
   l1 = max(0, r - 3)
   l2 = min(5, r + 3)
   key = board[r][c]
   count = 0
   for i in range(l1,l2 + 1):
       if board[i][c] == key :
           count += 1
           if count == 4: return True
       else: count = 0

   l1 = max(0, c - 3)
   l2 = min(6, c + 3)
   count = 0
   for i in range(l1,l2 + 1):
       if board[r][i] == key :
           count += 1
           if count == 4: return True
       else: count = 0

   count = 0
   for i in range(-3,4):
       row = r + i
       col = c + i
       if (0 > row or row > 5 or 0 > col or col > 6): continue
       elif board[row][col] == key :
           count += 1
           if count == 4: return True
       else: count = 0

   count = 0
   for i in range(-3,4):
       row = r + i
       col = c - i
       if (0 > row or row > 5 or 0 > col or col > 6): continue
       elif board[row][col] == key :
           count += 1
           if count == 4: return True
       else: count = 0

   return False

def is_game_over(r,c,board,cols_height,player):
    if (check_winner(r,c,board)): return 1 if player else 2
    elif cols_height.count(6) == len(cols_height): return 0
    else: return -1

def legal_moves(cols_height):
    legal_mv = []
    for i in [3,2,4,1,5,0,6]:
        if cols_height[i] < 6 : legal_mv.append(i)
    return legal_mv

def drop(c,board,cols_height,player):
    r = 5 - cols_height[c] 
    board[r][c] = 'R' if player else 'Y'
    cols_height[c] += 1
    return [r,c]

def undo_drop(r,c,board,cols_height):
    board[r][c] = '.'
    cols_height[c] -= 1

def evaluate_window(window):
    p_cells = window.count('Y')
    o_cells = window.count('R')
    e_cells = len(window) - (p_cells + o_cells)
    if p_cells == 3 and e_cells == 1:
        return 100
    if p_cells == 2 and e_cells == 2:
        return 5
    if p_cells == 1 and e_cells == 3:
        return 1
    if o_cells == 3 and e_cells == 1:
        return -100
    if o_cells == 2 and e_cells == 2:
        return -5
    if o_cells == 1 and e_cells == 3:
        return -1
    return 0

def scorer(board,windows,cols_height):
    score = 0
    for window_coord in windows:
        window = [board[coord[0]][coord[1]] for coord in window_coord]
        score += evaluate_window(window)
    return score


def minimax(depth,alpha,beta,board,windows,cols_height,player):
    if depth == 0 : return scorer(board,windows,cols_height)
    legal_mv = legal_moves(cols_height)
    if player:
        value = float("inf")
        for move in legal_mv:
            r,c = drop(move,board,cols_height,player)
            n = is_game_over(r,c,board,cols_height,player) 
            if n != -1:
                undo_drop(r,c,board,cols_height)
                if n == 0: return 0
                elif n == 1: return -100000 * depth
                elif n == 2: return 100000  * depth
            score = minimax(depth - 1,alpha,beta,board,windows,cols_height,not player)
            value = min(value, score)
            beta = min(beta, value)
            undo_drop(r,c,board,cols_height)
            if alpha >= beta : break
    else:
        value = -float("inf")
        for move in legal_mv:
            r,c = drop(move,board,cols_height,player)
            n = is_game_over(r,c,board,cols_height,player) 
            if n != -1:
                undo_drop(r,c,board,cols_height)
                if n == 0: return 0
                elif n == 1: return -100000 * depth
                elif n == 2: return 100000  * depth
            score = minimax(depth - 1,alpha,beta,board,windows,cols_height, not player)
            value = max(value, score)
            alpha = max(alpha, value)
            undo_drop(r,c,board,cols_height)
            if alpha >= beta : break
    return value

def best_move(depth_config,board,windows,cols_height):
    legal_mv = legal_moves(cols_height)
    best_score = -float("inf");
    best_mv = legal_mv[0]
    for move in legal_mv:
        r,c = drop(move,board,cols_height,False)
        n = is_game_over(r,c,board,cols_height,False) 
        if n == 2:
            undo_drop(r,c,board,cols_height)
            return move + 1
        elif n == 0:
            undo_drop(r,c,board,cols_height)
            continue
        score = minimax(depth_config - 1,-float("inf"),float("inf"),board,windows,cols_height,True)
        undo_drop(r,c,board,cols_height)
        if score > best_score: 
            best_mv = move
            best_score = score
    return best_mv + 1

def generate_windows():
    windows = []
    #row
    for row in range(6):
        for idx in range(4):
            window_coord = [ (row,i) for i in range(idx, idx + 4)]
            windows.append(window_coord)
    #columns
    for col in range(7):
        for row in range(3):
            window_coord = [ (i,col) for i in range(row, row + 4)]
            windows.append(window_coord)
    #left diagonals
    for col in range(1,4):
        for k in range(4-col):
            window_coord = [ (0 + i,col + i) for i in range(k, k + 4)]
            windows.append(window_coord)
    for row in range(3):
        for k in range(3-row):
            window_coord = [ (row + i,0 + i) for i in range(k, k + 4)]
            windows.append(window_coord)
    #right diagonals
    for col in range(3,6):
        for k in range(4-(6-col)):
            window_coord = [ (0 + i,col - i) for i in range(k, k + 4)]
            windows.append(window_coord)
    for row in range(3):
        for k in range(3-row):
            window_coord = [ (row + i,6 - i) for i in range(k,k + 4)]
            windows.append(window_coord)
    return windows

board = [["." for _ in range(7)] for _ in range (6)]
cols_height = [0,0,0,0,0,0,0]
player = True
# Player -> True -> Red -> Human
# Player -> False -> Yellow -> AI
windows = generate_windows()
depth_config = 6
while (True):
    if player :
        col = int(input("Column: "))
        while (col < 1 or col > 7 or cols_height[col - 1] == 6):
            if (1 <= col <= 7 and cols_height[col - 1] == 6): print("Column-", col, " is full !!") 
            print("Invalid Move !! Try again !!")
            col = int(input("Column: "))
    else:
        col = best_move(depth_config,board,windows,cols_height)
    r,c = drop(col - 1,board,cols_height,player)
    for i in range(6):
        print(board[i])
    print("Score: ", scorer(board,windows,cols_height))
    n = is_game_over(r,c,board,cols_height,player) 
    if n != -1:
        if n == 0: print("Draw !!")
        elif n == 1: print("R is the winner !!")
        elif n == 2: print("Y is the winner !!")
        break
    player = not player
