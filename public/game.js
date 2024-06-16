document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const backgroundMusic = new Audio('background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const startScreen = document.getElementById('startScreen');
    const centerButton = document.getElementById('centerButton');
    const userInfo = document.getElementById('userInfo');
    const footer = document.getElementById('footer');
    const userPoints = document.getElementById('points'); 
    const userTickets = document.getElementById('tickets'); 

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

    centerButton.addEventListener('click', async () => {
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
        startMusic();
        initGame();
        gameLoop();
    });

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const WHITE = '#FFFFFF';
    const BLACK = '#000000';
    const TILE_COLOR = BLACK;
    const BORDER_COLOR = '#0000FF';
    const SKY_BLUE = '#87CEEB';
    const SHADOW_COLOR = '#000080';

    const COLUMNS = 4;
    const SEPARATOR = 5;
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
            if (!tiles.some(tile => {
                const rect = { x: newTileX, y: newTileY, width: TILE_WIDTH, height: TILE_HEIGHT };
                return tile.y < rect.y + rect.height && tile.y + tile.height > rect.y &&
                    tile.x < rect.x + rect.width && tile.x + tile.width > rect.x;
            })) {
                tiles.push(new Tile(newTileX, newTileY));
                break;
            }
        }
    }

    function handleClick(event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        let clickedOnTile = false;
        tiles.forEach(tile => {
            if (tile.isClicked(mouseX, mouseY) && !tile.clicked) {
                tile.startDisappearing();
                clickedOnTile = true;
                score++;
                addNewTile();
            }
        });

        if (!clickedOnTile) {
            gameRunning = false;
            gameOver();
        }
    }

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        handleClick({
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
    });

    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        let outOfBounds = false;
        tiles.forEach(tile => {
            tile.move(TILE_SPEED);
            tile.updateOpacity();
            if (tile.isOutOfBounds()) {
                outOfBounds = true;
            }
            tile.draw();
        });

        if (outOfBounds) {
            gameRunning = false;
            gameOver();
            return;
        }

        tiles = tiles.filter(tile => tile.y < HEIGHT && tile.opacity > 0);

        while (tiles.length < 4) {
            addNewTile();
        }

        ctx.fillStyle = SHADOW_COLOR;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2 + 2, 32);

        ctx.fillStyle = SKY_BLUE;
        ctx.fillText(`SCORE: ${score}`, WIDTH / 2, 30);

        TILE_SPEED += SPEED_INCREMENT;

        requestAnimationFrame(gameLoop);
    }

    function startMusic() {
        backgroundMusic.play().catch(function(error) {
            console.error('Error playing audio:', error);
        });
    }

    tg.onEvent('themeChanged', function() {
        const themeParams = tg.themeParams;
        if (themeParams && themeParams.bg_color && !themeParams.bg_color.includes('unset') && !themeParams.bg_color.includes('none')) {
            document.body.style.backgroundColor = themeParams.bg_color;
        }
    });

    tg.ready().then(function() {
        if (tg.themeParams) {
            const themeParams = tg.themeParams;
            if (themeParams.bg_color && !themeParams.bg_color.includes('unset') && !themeParams.bg_color.includes('none')) {
                document.body.style.backgroundColor = themeParams.bg_color;
            }
        }
        if (tg.initDataUnsafe?.user) {
            userInfo.textContent = tg.initDataUnsafe.user.username || `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name}`;
        } else {
            userInfo.textContent = 'Username';
        }
        if (tg.initDataUnsafe?.is_explicitly_enabled) {
            startMusic();
        }
    });

    async function gameOver() {
        // Save points to the server
        await saveUser(userInfo.textContent, score);

        // Immediately redirect to transition.html
        window.location.replace(`transition.html?score=${score}`);
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
                points = result.data.points; // Update points with the latest value from the server
                userPoints.textContent = `Points: ${points}`; // Update the points in the UI
            } else {
                console.error('Error saving user:', result.error);
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }
});
