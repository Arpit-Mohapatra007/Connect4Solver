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

board = [["." for _ in range(7)] for _ in range (6)]
cols_height = [0,0,0,0,0,0,0]
player = True
win = 0
while (True):
    draw = True
    for i in board:
        if i.count('.') != 0:
            draw = False
            break

    if draw: break
        
    col = int(input("Column: "))
    while (col < 1 or col > 7 or cols_height[col - 1] == 6):
        if (1 <= col <= 7 and cols_height[col - 1] == 6): print("Column-", col, " is full !!") 
        print("Invalid Move !! Try again !!")
        col = int(input("Column: "))
    c = col - 1
    r = 5 - cols_height[c] 
    board[r][c] = 'R' if player else 'Y'
    cols_height[c] += 1
    for i in range(6):
        print(board[i])
    if (check_winner(r,c,board)):
        win = 1 if player else 2
        break
    player = not player

match win:
    case 0:
        print("Draw !!")
    case 1:
        print("R is the winner !!")
    case 2:
        print("Y is the winner !!")
