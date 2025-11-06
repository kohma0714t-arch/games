document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const globalBoardElement = document.getElementById('global-board');
    const statusTextElement = document.getElementById('status-text');
    const resetButton = document.getElementById('reset-button');
    const coinTossOverlay = document.getElementById('coin-toss-overlay');
    const tossButton = document.getElementById('toss-button');
    const coinResultText = document.getElementById('coin-result-text');
    const coinElement = document.getElementById('coin');
    const playerXNameInput = document.getElementById('playerXNameInput');
    const playerONameInput = document.getElementById('playerONameInput');

    const PLAYER_X = 'X';
    const PLAYER_O = 'O';
    const DRAW = 'DRAW';

    // ゲーム状態の変数
    let globalBoardState;
    let localBoardsState;
    let currentPlayer;
    let nextPlayableBoard;
    let gameOver;
    let playerXName = 'Player X';
    let playerOName = 'Player O';

    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    function initializeGame() {
        // ゲーム状態のリセット
        globalBoardState = Array(9).fill(null);
        localBoardsState = Array(9).fill(null).map(() => Array(9).fill(null));
        currentPlayer = null;
        nextPlayableBoard = null;
        gameOver = false;
        
        // UIのリセット
        createBoard();
        // ★★★ 修正点: ゲーム開始前の不要なUI更新処理を削除しました ★★★
        // updateUI(); 
        
        statusTextElement.textContent = 'Game setup...';
        
        // コイン投げ画面の表示とリセット
        coinTossOverlay.classList.add('active');
        coinResultText.textContent = '';
        coinElement.classList.remove('flipping');
        coinElement.style.transform = '';
        tossButton.disabled = false;
        playerXNameInput.value = playerXName;
        playerONameInput.value = playerOName;
    }

    function createBoard() {
        globalBoardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const localBoard = document.createElement('div');
            localBoard.classList.add('local-board');
            localBoard.dataset.globalIndex = i;

            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.globalIndex = i;
                cell.dataset.localIndex = j;
                localBoard.appendChild(cell);
            }
            globalBoardElement.appendChild(localBoard);
        }
    }

    function handleTossClick() {
        playerXName = playerXNameInput.value || 'Player X';
        playerOName = playerONameInput.value || 'Player O';

        tossButton.disabled = true;
        coinElement.classList.remove('flipping');
        coinElement.style.transform = '';

        const isHeads = Math.random() < 0.5;
        coinElement.classList.add('flipping');

        setTimeout(() => {
            coinElement.classList.remove('flipping');
            if (!isHeads) {
                coinElement.style.transform = 'rotateY(180deg)';
            } else {
                coinElement.style.transform = 'rotateY(0deg)';
            }

            currentPlayer = isHeads ? PLAYER_X : PLAYER_O;
            const winnerName = isHeads ? playerXName : playerOName;
            
            const result = isHeads ? '表' : '裏';
            coinResultText.textContent = `${result}が出ました！ ${winnerName} が先攻です。`;

            setTimeout(() => {
                coinTossOverlay.classList.remove('active');
                nextPlayableBoard = null;
                updateUI(); // ゲームが始まるこのタイミングでUIを初めて更新します
            }, 2000);

        }, 1500);
    }

    function handleCellClick(e) {
        if (gameOver || !e.target.classList.contains('cell')) return;

        const globalIndex = parseInt(e.target.dataset.globalIndex);
        const localIndex = parseInt(e.target.dataset.localIndex);

        if (nextPlayableBoard !== null && nextPlayableBoard !== globalIndex) return;
        if (globalBoardState[globalIndex] !== null) return;
        if (localBoardsState[globalIndex][localIndex] !== null) return;

        localBoardsState[globalIndex][localIndex] = currentPlayer;
        
        const localWinner = checkWinner(localBoardsState[globalIndex]);
        if (localWinner) {
            globalBoardState[globalIndex] = localWinner;
            const globalWinner = checkWinner(globalBoardState);
            if (globalWinner) {
                endGame(globalWinner);
            }
        } else if (localBoardsState[globalIndex].every(cell => cell !== null)) {
            globalBoardState[globalIndex] = DRAW;
        }
        
        if (!gameOver && globalBoardState.every(state => state !== null)) {
            endGame(DRAW);
        }

        if (!gameOver) {
            nextPlayableBoard = globalBoardState[localIndex] === null ? localIndex : null;
            switchPlayer();
            updateUI();
        } else {
            document.querySelectorAll('.local-board').forEach(board => board.classList.remove('playable'));
        }
    }

    function checkWinner(boardState) {
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                return boardState[a];
            }
        }
        return null;
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    }
    
    function endGame(winner) {
        gameOver = true;
        if (winner === DRAW) {
            statusTextElement.textContent = "It's a Draw!";
        } else {
            const winnerName = winner === PLAYER_X ? playerXName : playerOName;
            statusTextElement.textContent = `${winnerName} Wins! 🎉`;
        }
    }

    function updateUI() {
        for (let i = 0; i < 9; i++) {
            if (globalBoardElement.children[i]) {
                for (let j = 0; j < 9; j++) {
                    if (globalBoardElement.children[i].children[j]) {
                        const cell = globalBoardElement.children[i].children[j];
                        const mark = localBoardsState[i][j];
                        cell.classList.remove(PLAYER_X, PLAYER_O);
                        if (mark) {
                            cell.classList.add(mark);
                        }
                    }
                }
            }
        }

        document.querySelectorAll('.local-board').forEach((board, index) => {
            board.classList.remove('playable', 'won', PLAYER_X, PLAYER_O, DRAW);
            const winner = globalBoardState[index];
            if (winner) {
                board.classList.add('won', winner);
                board.dataset.winner = winner;
            }
            if (!gameOver) {
                if (nextPlayableBoard === null) {
                    if (globalBoardState[index] === null) {
                        board.classList.add('playable');
                    }
                } else {
                    if (index === nextPlayableBoard) {
                        board.classList.add('playable');
                    }
                }
            }
        });
        
        if (!gameOver && currentPlayer) {
            const currentPlayerName = currentPlayer === PLAYER_X ? playerXName : playerOName;
            let nextBoardInfo = (nextPlayableBoard !== null) ? `(Next: Board ${nextPlayableBoard + 1})` : '(Next: Any Board)';
            statusTextElement.textContent = `${currentPlayerName}'s turn ${nextBoardInfo}`;
        }
    }
    
    // イベントリスナー
    globalBoardElement.addEventListener('click', handleCellClick);
    resetButton.addEventListener('click', initializeGame);
    tossButton.addEventListener('click', handleTossClick);

    // ゲーム開始
    initializeGame();
});
