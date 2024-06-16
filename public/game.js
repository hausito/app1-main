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
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
    }

    const backgroundMusic = new Audio('background-music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const startScreen = document.getElementById('startScreen');
    const centerButton = document.getElementById('centerButton');
    const userInfo = document.getElementById('userInfo');
    const footer = document.getElementById('footer');
    const userPoints = document.getElementById('points');
    const userTickets = document.getElementById('tickets');

    let points = 0;
    let tickets = 0;

    // Initialize Telegram Web Apps API
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;

    // Set username or fallback to "Username"
    if (user) {
        userInfo.textContent = user.username || `${user.first_name} ${user.last_name}`;
    } else {
        userInfo.textContent = 'Username';
    }

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
        if (tickets > 0) {
            tickets--;
            userTickets.textContent = `Tickets: ${tickets}`;

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
        startMusic();
        initGame();
        gameLoop();
    });

    // Other game-related functions (initGame, gameLoop, etc.) remain the same

    function startMusic() {
        backgroundMusic.play().catch(function (error) {
            console.error('Error playing audio:', error);
        });
    }

    tg.onEvent('themeChanged', function () {
        const themeParams = tg.themeParams;
        if (themeParams && themeParams.bg_color && !themeParams.bg_color.includes('unset') && !themeParams.bg_color.includes('none')) {
            document.body.style.backgroundColor = themeParams.bg_color;
        }
    });

    tg.ready().then(function () {
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
});
