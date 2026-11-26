
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const colors = [
    null,
    "#00FFFF",
    "#FFFF00",
    "#AA00FF",
    "#00FF00",
    "#FF0000",
    "#0000FF",
    "#FF8800"
];

// Seven Tetris pieces
const shapes = [
    [[1, 1, 1, 1]],

    [[2, 2],
     [2, 2]],

    [[0, 3, 0],
     [3, 3, 3]],

    [[0, 4, 4],
     [4, 4, 0]],

    [[5, 5, 0],
     [0, 5, 5]],

    [[6, 0, 0],
     [6, 6, 6]],

    [[0, 0, 7],
     [7, 7, 7]]
];

let board;
let player;
let score = 0;
let gameOver = false;
let paused = false;

let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;

// Create an empty board
function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );
}

// Generate a random piece
function createPiece() {
    const index = Math.floor(
        Math.random() * shapes.length
    );

    return shapes[index].map(row => [...row]);
}

// Draw a single block
function drawBlock(x, y, value) {
    ctx.fillStyle = colors[value];

    ctx.fillRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );

    ctx.strokeStyle = "#222";

    ctx.strokeRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );
}

// Draw a matrix
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(
                    x + offset.x,
                    y + offset.y,
                    value
                );
            }
        });
    });
}

// Draw the entire game
function draw() {
    ctx.fillStyle = "#080d18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// Check for collisions
function collide(board, player) {
    const matrix = player.matrix;
    const pos = player.pos;

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {

            if (matrix[y][x] === 0) continue;

            const newX = x + pos.x;
            const newY = y + pos.y;

            if (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS
            ) {
                return true;
            }

            if (newY >= 0 && board[newY][newX] !== 0) {
                return true;
            }
        }
    }

    return false;
}

// Merge the current piece into the board
function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y]
                     [x + player.pos.x] = value;
            }
        });
    });
}

// Remove completed rows
function clearRows() {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {

        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));

            cleared++;
            y++;
        }
    }

    const points = [0, 100, 300, 500, 800];

    score += points[cleared];

    document.getElementById("score").textContent = score;
}

// Generate a new falling piece
function resetPlayer() {
    player.matrix = createPiece();

    player.pos.y = 0;

    player.pos.x = Math.floor(
        (COLS - player.matrix[0].length) / 2
    );

    if (collide(board, player)) {
        gameOver = true;

        document.getElementById("status").textContent =
            "Game Over!";
    }
}

// Move the piece left or right
function movePlayer(direction) {
    player.pos.x += direction;

    if (collide(board, player)) {
        player.pos.x -= direction;
    }
}

// Move the piece downward
function dropPlayer() {
    player.pos.y++;

    if (collide(board, player)) {
        player.pos.y--;

        merge();
        clearRows();
        resetPlayer();
    }

    dropCounter = 0;
}

// Rotate clockwise
function rotatePlayer() {
    const original = player.matrix;
    const originalX = player.pos.x;

    player.matrix = original[0].map(
        (_, index) =>
            original.map(row => row[index]).reverse()
    );

    // Try nearby positions when rotating near a wall
    for (const offset of [0, -1, 1, -2, 2]) {
        player.pos.x = originalX + offset;

        if (!collide(board, player)) {
            return;
        }
    }

    // Restore original position if rotation fails
    player.matrix = original;
    player.pos.x = originalX;
}

// Immediately drop the piece
function hardDrop() {
    while (!collide(board, player)) {
        player.pos.y++;
    }

    player.pos.y--;

    merge();
    clearRows();
    resetPlayer();

    dropCounter = 0;
}

// Restart the game
function restart() {
    board = createBoard();

    player = {
        pos: { x: 0, y: 0 },
        matrix: null
    };

    score = 0;
    gameOver = false;
    paused = false;
    dropCounter = 0;

    document.getElementById("score").textContent = 0;
    document.getElementById("status").textContent = "";

    resetPlayer();
    draw();
}

// Keyboard controls
document.addEventListener("keydown", event => {

    if (
        ["ArrowLeft", "ArrowRight", "ArrowUp",
         "ArrowDown", "Space"].includes(event.code)
    ) {
        event.preventDefault();
    }

    if (event.code === "KeyP" && !gameOver) {
        paused = !paused;

        document.getElementById("status").textContent =
            paused ? "Paused" : "";

        return;
    }

    if (gameOver || paused) return;

    switch (event.code) {

        case "ArrowLeft":
            movePlayer(-1);
            break;

        case "ArrowRight":
            movePlayer(1);
            break;

        // case "ArrowDown":
        //     dropPlayer();
        //     break;

        // case "ArrowUp":
        case "Space":
            rotatePlayer();
            break;

        // case "Space":
        case "ArrowDown":
            hardDrop();
            break;
    }

    draw();
});

// Main animation loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!gameOver && !paused) {

        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {
            dropPlayer();
        }

        draw();
    }

    requestAnimationFrame(update);
}

// Initialize the game
restart();
update();
