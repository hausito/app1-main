document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const backgroundMusic = new Audio('background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const startScreen = document.getElementById('startScreen');
    const playButton = document.getElementById('playButton');
    const tasksButton = document.getElementById('tasksButton');
    const upgradeButton = document.getElementById('upgradeButton');
    const userInfo = document.getElementById('userInfo');
    const footer = document.getElementById('footer');
    const userPoints = document.getElementById('points');
    const userTickets = document.getElementById('ticketsInfo');
    const header = document.getElementById('header');

    // Initialize Telegram Web Apps API
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;

    // Set username or fallback to "Username"
    if (user) {
        userInfo.textContent = user.username || `${user.first_name} ${user.last_name}`;
    } else {
        userInfo.textContent = 'Username';
    }

    let points = 0;
    let tickets = 0;

    // Fetch initial user data (points and tickets)
    const fetchUserData = async () => {
        try {
            const response = await fetch(`/getUserData?username=${encodeURIComponent(userInfo.textContent)}`);
            const data = await response.json();
            if (data.success) {
                points = data.points;
                tickets = data.tickets;
                userPoints.textContent = `Points: ${points}`;
                userTickets.textContent = `Tickets: ${tickets}`;
            } else {
                console.error('Failed to fetch user data:', data.error);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    fetchUserData();

    playButton.addEventListener('click', async () => {
        if (tickets > 0) {
            tickets--;
            userTickets.textContent = `Tickets: ${tickets}`;

            // Update tickets on the server
            try {
                const response = await fetch('/updateTickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: userInfo.textContent, tickets }),
                });

                const result = await response.json();
                if (!result.success) {
                    console.error('Error updating tickets:', result.error);
                }
            } catch (error) {
                console.error('Error updating tickets:', error);
            }
        } else {
            alert('No more tickets available!');
            return;
        }

        startScreen.style.display = 'none';
        footer.style.display = 'none';
        header.style.display = 'none';
        startMusic();
        initGame();
        lastTimestamp = performance.now();
        requestAnimationFrame(gameLoop);
    });

    tasksButton.addEventListener('click', () => {
        alert('Tasks: Coming Soon!');
    });

    upgradeButton.addEventListener('click', () => {
        alert('Upgrade: Coming Soon!');
    });

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const TILE_COLOR = '#2F3C7E';
    const BORDER_COLOR = '#FBEAEB';
    const SKY_BLUE = '#4EB6E6';
    const SHADOW_COLOR = '#F0F5F9';

    const TILE_WIDTH = WIDTH / 4;
    const TILE_HEIGHT = 50;
    const SEPARATOR = 2;
    const COLUMNS = 4;

    const TILE_SPEED = 0.02;
    const SPEED_INCREMENT = 0.001;

    let score = 0;
    let tiles = [];
    let gameRunning = false;

    function initGame() {
        tiles = [];
        for (let i = 0; i < 4; i++) {
            addNewTile();
        }
        score = 0;
        gameRunning = true;
    }

    function addNewTile() {
        const columnIndex = Math.floor(Math.random() * COLUMNS);
        const x = columnIndex * (TILE_WIDTH + SEPARATOR);
        const y = -TILE_HEIGHT;
        tiles.push({ x, y, opacity: 1 });
    }

    function startMusic() {
        backgroundMusic.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    async function gameOver() {
        await saveUser(userInfo.textContent, score);
        const redirectURL = `transition.html?score=${score}`;
        window.location.replace(redirectURL);
    }

    async function saveUser(username, scoreToAdd) {
        try {
            const response = await fetch('/saveUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, points: scoreToAdd }),
            });

            const result = await response.json();
            if (result.success) {
                points = result.data.points;
                userPoints.textContent = `Points: ${points}`;
            } else {
                console.error('Error saving user:', result.error);
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }

    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        tiles.forEach(tile => {
            tile.y += TILE_SPEED * deltaTime * 60;
            tile.opacity -= 0.01 * deltaTime * 60;
            ctx.fillStyle = TILE_COLOR;
            ctx.fillRect(tile.x, tile.y, TILE_WIDTH, TILE_HEIGHT);
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - tile.opacity})`;
            ctx.fillRect(tile.x, tile.y, TILE_WIDTH, TILE_HEIGHT);
        });

        tiles = tiles.filter(tile => tile.y < HEIGHT && tile.opacity > 0);

        if (tiles.length < 4) {
            addNewTile();
        }

        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = 4;
        for (let i = 1; i < COLUMNS; i++) {
            const x = i * (TILE_WIDTH + SEPARATOR);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }

        ctx.fillStyle = SHADOW_COLOR;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2 + 2, 32);

        ctx.fillStyle = SKY_BLUE;
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2, 30);

        TILE_SPEED += SPEED_INCREMENT * deltaTime * 60;

        if (gameRunning) {
            requestAnimationFrame(gameLoop);
        }
    }

    let lastTimestamp = performance.now();
});
