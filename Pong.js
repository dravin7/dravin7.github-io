const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let paddleHeight = 75;
let paddleWidth = 10;
let player1 = { y: canvas.height / 2 - paddleHeight / 2, username: '', score: 0 };
let player2 = { y: canvas.height / 2 - paddleHeight / 2, username: '', score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 5, dy: 2 };

const controlPaddle = (e) => {
    if (e.key === 'ArrowUp' && player1.y > 0) player1.y -= 10;
    if (e.key === 'ArrowDown' && player1.y < canvas.height - paddleHeight) player1.y += 10;
};

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, player1.y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, player2.y, paddleWidth, paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.closePath();

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top/bottom wall
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    const paddle1Collision = ball.x - ball.radius < paddleWidth && ball.y > player1.y && ball.y < player1.y + paddleHeight;
    const paddle2Collision = ball.x + ball.radius > canvas.width - paddleWidth && ball.y > player2.y && ball.y < player2.y + paddleHeight;

    if (paddle1Collision || paddle2Collision) {
        ball.dx = -ball.dx;
    }

    // Reset ball if it goes out of bounds
    if (ball.x + ball.radius < 0) {
        player2.score++;
        resetBall();
    }
    if (ball.x - ball.radius > canvas.width) {
        player1.score++;
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 5 * (Math.random() < 0.5 ? 1 : -1);
    ball.dy = 2 * (Math.random() < 0.5 ? 1 : -1);
}

function update() {
    draw();
}

// Game loop
function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

document.getElementById("startBtn").onclick = () => {
    player1.username = document.getElementById("username").value;
    if (!player1.username) alert("Please enter a username!");
    else {
        document.getElementById("username").style.display = "none";
        document.getElementById("startBtn").style.display = "none";
        window.addEventListener("keydown", controlPaddle);
        gameLoop();
    }
};
