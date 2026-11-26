
const MAX_ATTEMPTS = 8;

let secretNumber;
let attempts = 0;
let gameOver = false;
let animationId = null;

// Generate a four-digit number
function generateNumber() {

    let digits = [];

    while (digits.length < 4) {

        let digit = Math.floor(Math.random() * 10);

        // First digit cannot be zero
        if (digits.length === 0 && digit === 0) {
            continue;
        }

        // No repeated digits
        if (!digits.includes(digit)) {
            digits.push(digit);
        }
    }

    return digits.join("");
}

// Validate the guess
function validateGuess(guess) {

    return /^[1-9][0-9]{3}$/.test(guess)
        && new Set(guess).size === 4;
}

// Calculate A and B
function compareNumbers(secret, guess) {

    let A = 0;
    let B = 0;

    for (let i = 0; i < 4; i++) {

        if (guess[i] === secret[i]) {
            A++;
        } else if (secret.includes(guess[i])) {
            B++;
        }
    }

    return { A, B };
}

// Update remaining attempts
function updateAttempts() {

    const remaining = MAX_ATTEMPTS - attempts;

    document.getElementById("attempts").textContent =
        attempts;

    document.getElementById("remaining").textContent =
        remaining;

    const progress = document.getElementById("progress");

    progress.style.width =
        `${remaining / MAX_ATTEMPTS * 100}%`;

    // Change progress bar color
    if (remaining <= 2) {
        progress.style.backgroundColor = "#ef4444";
    } else if (remaining <= 4) {
        progress.style.backgroundColor = "#facc15";
    } else {
        progress.style.backgroundColor = "#22c55e";
    }
}

// Process the user's guess
function checkGuess() {

    if (gameOver) return;

    const input = document.getElementById("guess");
    // const message = document.getElementById("message");

    const guess = input.value.trim();

    // Invalid guesses do not count
    if (!validateGuess(guess)) {

        // message.textContent =
        //     "Enter four different digits with no leading zero.";

        return;
    }

    attempts++;

    const { A, B } = compareNumbers(
        secretNumber,
        guess
    );

    updateAttempts();

    // Add result to the right column
    const history = document.getElementById("history");
    const row = history.insertRow(-1);

    row.insertCell(0).textContent = attempts;
    row.insertCell(1).textContent = guess;

    row.insertCell(2).innerHTML =
        `<span class="result-a">${A}A</span>
         <span class="result-b">${B}B</span>`;

    // Check for success first
    if (A === 4) {

        row.classList.add("winning-row");

        // message.textContent =
        //     `🎉 Congratulations! You won in ${attempts} attempts!`;

        // message.style.color = "#4ade80";

        finishGame();

        launchFireworks();

        return;
    }

    // Check whether all 8 attempts have been used
    if (attempts >= MAX_ATTEMPTS) {

        // message.textContent =
        //     "Game Over! You have used all 8 attempts.";

        // message.style.color = "#f87171";

        finishGame();

        showFailurePopup();

        return;
    }

    // Continue the game
    // message.textContent =
    //     `Result: ${A}A${B}B. Keep guessing!`;

    // message.style.color = "#facc15";

    input.value = "";
    input.focus();
}

// Finish the current game
function finishGame() {

    gameOver = true;

    document.getElementById("secret").textContent =
        secretNumber;

    document.getElementById("guess").disabled = true;

    document.getElementById("submit").disabled = true;
}

// Display failure popup
function showFailurePopup() {

    document.getElementById("answer").textContent =
        secretNumber;

    document.getElementById("popup").style.display =
        "flex";
}

// Close failure popup
function closePopup() {

    document.getElementById("popup").style.display =
        "none";
}

// Start a new game
function newGame() {

    stopFireworks();

    secretNumber = generateNumber();

    attempts = 0;
    gameOver = false;

    document.getElementById("history").innerHTML = "";

    document.getElementById("secret").textContent =
        "? ? ? ?";

    // const message = document.getElementById("message");

    // message.textContent = "";
    // message.style.color = "#facc15";

    const input = document.getElementById("guess");

    input.value = "";
    input.disabled = false;

    document.getElementById("submit").disabled = false;

    updateAttempts();

    closePopup();

    input.focus();
}

// Stop fireworks animation
function stopFireworks() {

    if (animationId !== null) {

        cancelAnimationFrame(animationId);

        animationId = null;
    }

    const canvas = document.getElementById("fireworks");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Fireworks animation
function launchFireworks() {

    stopFireworks();

    const canvas = document.getElementById("fireworks");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    const colors = [
        "#ff4444",
        "#ffcc00",
        "#00ff88",
        "#00ccff",
        "#ff66ff",
        "#ff8800",
        "#ffffff"
    ];

    const duration = 4000;
    const startTime = performance.now();

    let lastExplosion = -500;

    // Create one fireworks explosion
    function createExplosion() {

        const x = canvas.width *
            (0.15 + Math.random() * 0.7);

        const y = canvas.height *
            (0.1 + Math.random() * 0.5);

        const color = colors[
            Math.floor(Math.random() * colors.length)
        ];

        for (let i = 0; i < 70; i++) {

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 2,
                color: color,
                life: 1
            });
        }
    }

    // Animate fireworks
    function animate(time) {

        const elapsed = time - startTime;

        ctx.clearRect(
            0, 0, canvas.width, canvas.height
        );

        // Create a new explosion every 350 milliseconds
        if (
            elapsed < 2800 &&
            elapsed - lastExplosion >= 350
        ) {
            createExplosion();
            lastExplosion = elapsed;
        }

        for (let i = particles.length - 1; i >= 0; i--) {

            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;

            // Gravity
            p.vy += 0.04;

            // Air resistance
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Gradually fade out
            p.life -= 0.015;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.globalAlpha = 1;

        if (elapsed < duration) {

            animationId = requestAnimationFrame(animate);

        } else {

            ctx.clearRect(
                0, 0, canvas.width, canvas.height
            );

            animationId = null;
        }
    }

    animationId = requestAnimationFrame(animate);
}

// Button event listeners
document.getElementById("submit")
    .addEventListener("click", checkGuess);

document.getElementById("restart")
    .addEventListener("click", newGame);

document.getElementById("try-again")
    .addEventListener("click", newGame);

document.getElementById("close-popup")
    .addEventListener("click", closePopup);

// Only allow numeric input
document.getElementById("guess")
    .addEventListener("input", function(event) {

        event.target.value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 4);
    });

// Press Enter to submit
document.getElementById("guess")
    .addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            checkGuess();
        }
    });

// Initialize the game
newGame();
