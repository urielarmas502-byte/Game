class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore2048') || 0;
        this.history = [];
        this.gameOver = false;
        this.won = false;
        
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreDisplay = document.getElementById('score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalScore = document.getElementById('modalScore');
        this.modalBtn = document.getElementById('modalBtn');
        
        this.setupEventListeners();
        this.initGame();
        this.updateBestScore();
    }
    
    setupEventListeners() {
        // Botones direccionales
        document.getElementById('upBtn').addEventListener('click', () => this.move('up'));
        document.getElementById('downBtn').addEventListener('click', () => this.move('down'));
        document.getElementById('leftBtn').addEventListener('click', () => this.move('left'));
        document.getElementById('rightBtn').addEventListener('click', () => this.move('right'));
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Controles táctiles (swipe)
        this.setupTouchControls();
        
        // Botones de acción
        this.newGameBtn.addEventListener('click', () => this.initGame());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.modalBtn.addEventListener('click', () => this.initGame());
    }
    
    handleKeyPress(e) {
        const moves = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };
        
        if (moves[e.key]) {
            e.preventDefault();
            this.move(moves[e.key]);
        }
    }
    
    setupTouchControls() {
        let startX = 0;
        let startY = 0;
        
        this.gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, false);
        
        this.gameBoard.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = endX - startX;
            const diffY = endY - startY;
            const minSwipe = 50;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > minSwipe) {
                    this.move(diffX > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(diffY) > minSwipe) {
                    this.move(diffY > 0 ? 'down' : 'up');
                }
            }
        }, false);
    }
    
    initGame() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.history = [];
        this.gameOver = false;
        this.won = false;
        this.gameOverModal.classList.remove('show');
        
        this.addNewTile();
        this.addNewTile();
        
        this.updateDisplay();
    }
    
    addNewTile() {
        const emptyTiles = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyTiles.push({row: i, col: j});
                }
            }
        }
        
        if (emptyTiles.length > 0) {
            const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[randomTile.row][randomTile.col] = value;
        }
    }
    
    move(direction) {
        if (this.gameOver || this.won) return;
        
        // Guardar estado actual en historial
        this.history.push(JSON.parse(JSON.stringify({
            grid: this.grid,
            score: this.score
        })));
        
        // Limitar historial a 20 movimientos
        if (this.history.length > 20) {
            this.history.shift();
        }
        
        const oldGrid = JSON.parse(JSON.stringify(this.grid));
        
        if (direction === 'left') this.moveLeft();
        else if (direction === 'right') this.moveRight();
        else if (direction === 'up') this.moveUp();
        else if (direction === 'down') this.moveDown();
        
        // Verificar si el grid cambió
        if (!this.gridsEqual(oldGrid, this.grid)) {
            this.addNewTile();
        } else {
            // Si no hubo cambio, eliminar del historial
            this.history.pop();
        }
        
        this.checkGameState();
        this.updateDisplay();
    }
    
    moveLeft() {
        for (let i = 0; i < this.gridSize; i++) {
            this.compressRow(this.grid[i]);
            this.mergeRow(this.grid[i]);
            this.compressRow(this.grid[i]);
        }
    }
    
    moveRight() {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i].reverse();
            this.compressRow(this.grid[i]);
            this.mergeRow(this.grid[i]);
            this.compressRow(this.grid[i]);
            this.grid[i].reverse();
        }
    }
    
    moveUp() {
        for (let j = 0; j < this.gridSize; j++) {
            const column = [this.grid[0][j], this.grid[1][j], this.grid[2][j], this.grid[3][j]];
            this.compressRow(column);
            this.mergeRow(column);
            this.compressRow(column);
            
            for (let i = 0; i < this.gridSize; i++) {
                this.grid[i][j] = column[i];
            }
        }
    }
    
    moveDown() {
        for (let j = 0; j < this.gridSize; j++) {
            const column = [this.grid[0][j], this.grid[1][j], this.grid[2][j], this.grid[3][j]];
            column.reverse();
            this.compressRow(column);
            this.mergeRow(column);
            this.compressRow(column);
            column.reverse();
            
            for (let i = 0; i < this.gridSize; i++) {
                this.grid[i][j] = column[i];
            }
        }
    }
    
    compressRow(row) {
        const nonZeroValues = row.filter(val => val !== 0);
        const zeros = Array(row.length - nonZeroValues.length).fill(0);
        return row.splice(0, row.length, ...nonZeroValues, ...zeros);
    }
    
    mergeRow(row) {
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
                row[i] *= 2;
                this.score += row[i];
                
                // Marcar como merge para animación
                this.markTileAseMerged(row[i]);
                
                row.splice(i + 1, 1);
                row.push(0);
                
                if (row[i] === 2048) {
                    this.won = true;
                }
            }
        }
    }
    
    markTileAseMerged(value) {
        // Esta función marcará el tile para la animación de merge
        this.mergedTile = value;
    }
    
    gridsEqual(grid1, grid2) {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (grid1[i][j] !== grid2[i][j]) return false;
            }
        }
        return true;
    }
    
    checkGameState() {
        if (this.canMove()) return;
        
        this.gameOver = true;
    }
    
    canMove() {
        // Verificar si hay espacios vacíos
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return true;
            }
        }
        
        // Verificar si hay movimientos posibles
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                
                if ((i < this.gridSize - 1 && current === this.grid[i + 1][j]) ||
                    (j < this.gridSize - 1 && current === this.grid[i][j + 1])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            this.grid = previousState.grid;
            this.score = previousState.score;
            this.gameOver = false;
            this.won = false;
            this.gameOverModal.classList.remove('show');
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.undoBtn.disabled = this.history.length === 0;
        
        // Limpiar tablero
        this.gameBoard.innerHTML = '';
        
        // Dibujar tiles
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.grid[i][j];
                const tile = document.createElement('div');
                
                if (value !== 0) {
                    tile.className = 'tile pop';
                    tile.textContent = value;
                    tile.setAttribute('data-value', value);
                } else {
                    tile.className = 'tile';
                }
                
                this.gameBoard.appendChild(tile);
            }
        }
        
        // Mostrar modal si game over
        if (this.gameOver) {
            this.showGameOverModal();
        } else if (this.won) {
            this.showWinModal();
        }
        
        // Actualizar mejor puntuación
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.updateBestScore();
        }
    }
    
    updateBestScore() {
        this.bestScoreDisplay.textContent = this.bestScore;
        localStorage.setItem('bestScore2048', this.bestScore);
    }
    
    showGameOverModal() {
        this.modalTitle.textContent = '¡Game Over!';
        this.modalMessage.innerHTML = `Tu puntuación: <span>${this.score}</span>`;
        this.modalScore.textContent = this.score;
        this.gameOverModal.classList.add('show');
    }
    
    showWinModal() {
        this.modalTitle.textContent = '¡🎉 ¡Lo hiciste! 🎉';
        this.modalMessage.innerHTML = `Alcanzaste 2048 con <span>${this.score}</span> puntos`;
        this.gameOverModal.classList.add('show');
    }
}

// Iniciar el juego cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});