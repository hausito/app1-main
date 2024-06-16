document.addEventListener('DOMContentLoaded', async () => {
    const preloadImages = () => {
        const images = ['home.png', 'tasks.png', 'airdrop.png'];
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    };
    preloadImages();
   
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
    const header = document.getElementById('header'); // New line to get the header element

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
        // Deduct one ticket when starting the game
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
        footer.style.display = 'none';  // Hide footer when game starts
        header.style.display = 'none';  // Hide header when game starts
        startMusic();
        initGame();
        gameLoop();
    });

    tasksButton.addEventListener('click', () => {
        alert('Tasks: Coming Soon!');
    });

    upgradeButton.addEventListener('click', () => {
        alert('Upgrade: Coming Soon!');
    });

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const TILE_COLOR = '#000000';
    const BORDER_COLOR = '#0000FF';
    const SKY_BLUE = '#87CEEB';
    const SHADOW_COLOR = '#000080';

    const COLUMNS = 4;
    const SEPARATOR = 0; // Eliminating white space between tiles
    const VERTICAL_GAP = 5;
    const TILE_WIDTH = (WIDTH - (COLUMNS - 1) * SEPARATOR) / COLUMNS;
    const TILE_HEIGHT = HEIGHT / 4 - VERTICAL_GAP;

    let TILE_SPEED;
    const SPEED_INCREMENT = isMobileDevice() ? 0.005 : 0.002;

    let tiles = [];
    let score = 0;
    let gameRunning = true;

    class Tile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = TILE_WIDTH;
            this.height = TILE_HEIGHT;
            this.clicked = false;
            this.opacity = 1;
        }

        move(speed) {
            this.y += speed;
        }

        draw() {
            ctx.fillStyle = TILE_COLOR;
            ctx.globalAlpha = this.opacity;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        isClicked(mouseX, mouseY) {
            return this.x <= mouseX && this.x + this.width >= mouseX &&
                   this.y <= mouseY && this.y + this.height >= mouseY;
        }

        isOutOfBounds() {
            return this.y + this.height >= HEIGHT && !this.clicked;
        }

        startDisappearing() {
            this.clicked = true;
            this.opacity -= 0.05;
        }

        updateOpacity() {
            if (this.clicked && this.opacity > 0) {
                this.opacity -= 0.05;
            }
        }
    }

    function initGame() {
        tiles = [];
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(Math.random() * COLUMNS) * (TILE_WIDTH + SEPARATOR);
            const y = -(i * (TILE_HEIGHT + VERTICAL_GAP)) - TILE_HEIGHT;
            tiles.push(new Tile(x, y));
        }
        score = 0;
        TILE_SPEED = isMobileDevice() ? 6 : 2;
        gameRunning = true;

        backgroundMusic.play().catch(function(error) {
            console.error('Error playing audio:', error);
        });
    }

    function isMobileDevice() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    function addNewTile() {
        const attempts = 100;
        for (let i = 0; i < attempts; i++) {
            const newTileX = Math.floor(Math.random() * COLUMNS) * (TILE_WIDTH + SEPARATOR);
            const newTileY = Math.min(...tiles.map(tile => tile.y)) - TILE_HEIGHT - VERTICAL_GAP;
            if (!tiles.some(tile => tile.x === newTileX && tile.y === newTileY)) {
                tiles.push(new Tile(newTileX, newTileY));
                return;
            }
        }
    }

    function updateGame() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = SKY_BLUE;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.shadowColor = SHADOW_COLOR;
        ctx.shadowBlur = 10;

        let missedTile = false;
        for (const tile of tiles) {
            tile.move(TILE_SPEED);
            tile.draw();
            tile.updateOpacity();
            if (tile.isOutOfBounds()) {
                missedTile = true;
            }
        }

        tiles = tiles.filter(tile => tile.y < HEIGHT && tile.opacity > 0);

        if (missedTile) {
            gameRunning = false;
            setTimeout(endGame, 200);
        }

        TILE_SPEED += SPEED_INCREMENT;

        if (Math.random() < 0.02) {
            addNewTile();
        }

        ctx.font = '20px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 10, 30);
    }

    function endGame() {
        startScreen.style.display = 'block';
        footer.style.display = 'block';  // Show footer when game ends
        header.style.display = 'block';  // Show header when game ends

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        // Update points on the server
        fetch('/updatePoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: userInfo.textContent, points: score }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                points += score;
                userPoints.textContent = `Points: ${points}`;
            } else {
                console.error('Error updating points:', data.error);
            }
        })
        .catch(error => {
            console.error('Error updating points:', error);
        });

        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = SKY_BLUE;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.font = '40px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(`Game Over`, WIDTH / 2, HEIGHT / 2 - 40);
        ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 10);
    }

    function gameLoop() {
        if (gameRunning) {
            updateGame();
            requestAnimationFrame(gameLoop);
        }
    }

    canvas.addEventListener('click', (event) => {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        let clickedTile = null;
        for (const tile of tiles) {
            if (tile.isClicked(mouseX, mouseY) && !tile.clicked) {
                tile.startDisappearing();
                clickedTile = tile;
                score++;
                break;
            }
        }

        if (!clickedTile) {
            gameRunning = false;
            setTimeout(endGame, 200);
        }
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});
