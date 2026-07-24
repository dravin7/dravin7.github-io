// Canvas and Context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game Configuration
const PADDLE_HEIGHT = 75;
const PADDLE_WIDTH = 10;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 10;
const INITIAL_BALL_SPEED = 5;

// Game Mode
let gameMode = 'ai'; // 'ai' or 'multiplayer'
let isMultiplayer = false;
let isHost = false;

// Peer JS
let peer;
let connection;
let myPeerId = null;

// Player Objects
let player1 = {
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    username: '',
    score: 0,
    x: 0
};

let player2 = {
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    username: 'AI',
    score: 0,
    x: canvas.width - PADDLE_WIDTH
};

// Ball Object
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: BALL_RADIUS,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED
};

// Game State
let gameRunning = false;
let keys = {};

// Set game mode
function setGameMode(mode) {
    gameMode = mode;
    isMultiplayer = mode === 'multiplayer';
    
    // Update UI
    document.getElementById('aiMode').classList.toggle('active', mode === 'ai');
    document.getElementById('multiplayerMode').classList.toggle('active', mode === 'multiplayer');
    document.getElementById('peerIdInput').style.display = mode === 'multiplayer' ? 'block' : 'none';
    
    if (mode === 'multiplayer') {
        initPeer();
    }
}

// Initialize PeerJS
function initPeer() {
    if (!peer) {
        peer = new Peer();
        
        peer.on('open', (id) => {
            myPeerId = id;
            document.getElementById('myPeerId').style.display = 'block';
            document.getElementById('peerIdValue').textContent = id;
            console.log('My Peer ID:', id);
            updateStatus(`Your Peer ID: ${id}`);
        });
        
        peer.on('connection', (conn) => {
            connection = conn;
            isHost = false;
            setupConnection();
            updateStatus('Opponent connected! Starting game...');
        });
        
        peer.on('error', (err) => {
            console.error('Peer error:', err);
            updateStatus('Connection error: ' + err.type);
        });
    }
}

// Setup connection for data exchange
function setupConnection() {
    if (!connection) return;
    
    connection.on('data', (data) => {
        if (data.type === 'position') {
            player2.y = data.position;
        } else if (data.type === 'score') {
            player2.score = data.score;
        } else if (data.type === 'ballState') {
            if (isHost) {
                ball = data.ball;
            }
        }
    });
    
    connection.on('close', () => {
        updateStatus('Opponent disconnected!');
        gameRunning = false;
    });
}

// Send player position
function sendPlayerPosition() {
    if (connection && connection.open) {
        connection.send({
            type: 'position',
            position: player1.y
        });
    }
}

// Send ball state (host only)
function sendBallState() {
    if (connection && connection.open && isHost) {
        connection.send({
            type: 'ballState',
            ball: { x: ball.x, y: ball.y, dx: ball.dx, dy: ball.dy, radius: ball.radius }
        });
    }
}

// Update status message
function updateStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.classList.add('show');
}

// Copy Peer ID to clipboard
function copyPeerId() {
    const peerId = document.getElementById('peerIdValue').textContent;
    navigator.clipboard.writeText(peerId);
    alert('Peer ID copied to clipboard!');
}

// Keyboard Controls
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Update player paddle based on keyboard input
function updatePlayer1() {
    if (keys['ArrowUp'] && player1.y > 0) {
        player1.y -= PADDLE_SPEED;
    }
    if (keys['ArrowDown'] && player1.y < canvas.height - PADDLE_HEIGHT) {
        player1.y += PADDLE_SPEED;
    }
}

// Simple AI for player 2
function updatePlayer2AI() {
    const paddleCenter = player2.y + PADDLE_HEIGHT / 2;
    const ballCenter = ball.y;
    
    if (ballCenter < paddleCenter - 10 && player2.y > 0) {
        player2.y -= PADDLE_SPEED * 0.7;
    } else if (ballCenter > paddleCenter + 10 && player2.y < canvas.height - PADDLE_HEIGHT) {
        player2.y += PADDLE_SPEED * 0.7;
    }
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#FFF';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#FFF';
    ctx.fillRect(player1.x, player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(player2.x, player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player1.score, canvas.width / 4, 30);
    ctx.fillText(player2.score, (canvas.width * 3) / 4, 30);

    // Draw usernames
    ctx.font = '14px Arial';
    ctx.fillText(player1.username, canvas.width / 4, 55);
    ctx.fillText(player2.username, (canvas.width * 3) / 4, 55);
}

// Update ball position and handle collisions
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top/bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Ball collision with paddles
    if (
        ball.x - ball.radius < PADDLE_WIDTH + 5 &&
        ball.y > player1.y &&
        ball.y < player1.y + PADDLE_HEIGHT
    ) {
        ball.dx = Math.abs(ball.dx);
        ball.x = PADDLE_WIDTH + ball.radius;
        const hitPos = (ball.y - (player1.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 3;
    }

    if (
        ball.x + ball.radius > canvas.width - PADDLE_WIDTH - 5 &&
        ball.y > player2.y &&
        ball.y < player2.y + PADDLE_HEIGHT
    ) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = canvas.width - PADDLE_WIDTH - ball.radius;
        const hitPos = (ball.y - (player2.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 3;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        player2.score++;
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        player1.score++;
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = INITIAL_BALL_SPEED * (Math.random() < 0.5 ? 1 : -1);
    ball.dy = (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2;
}

// Main game loop
let frameCount = 0;
function gameLoop() {
    if (gameRunning) {
        updatePlayer1();
        
        if (isMultiplayer) {
            // Send position every frame
            sendPlayerPosition();
            // In multiplayer, host controls ball physics
            if (isHost) {
                updateBall();
                sendBallState();
            }
        } else {
            // Single player with AI
            updatePlayer2AI();
            updateBall();
        }
        
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Start game button handler
document.getElementById("startBtn").onclick = () => {
    const username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Please enter a username!");
        return;
    }

    if (isMultiplayer) {
        const opponentPeerId = document.getElementById("peerIdInput").value.trim();
        
        if (!opponentPeerId) {
            alert("Please enter opponent's Peer ID!");
            return;
        }
        
        if (!peer) {
            alert("Peer not initialized. Please wait a moment and try again.");
            return;
        }
        
        // Connect to opponent
        connection = peer.connect(opponentPeerId);
        isHost = true;
        
        connection.on('open', () => {
            player1.username = username;
            player2.username = 'Opponent';
            gameRunning = true;
            document.getElementById("username").style.display = "none";
            document.getElementById("peerIdInput").style.display = "none";
            document.getElementById("startBtn").style.display = "none";
            document.getElementById("gameInfo").style.display = "block";
            setupConnection();
            updateStatus("Connected! Game started!");
            gameLoop();
        });
        
        connection.on('error', (err) => {
            alert("Failed to connect: " + err);
        });
    } else {
        // AI mode
        player1.username = username;
        gameRunning = true;
        document.getElementById("username").style.display = "none";
        document.getElementById("startBtn").style.display = "none";
        document.getElementById("gameInfo").style.display = "block";
        gameLoop();
    }
};

// Initialize game loop
gameLoop();
