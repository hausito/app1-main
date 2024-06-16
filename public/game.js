body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-image: url('background.jpg'); /* Replace 'background.jpg' with your image path */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

#newLayout {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 400px;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.9); /* Different background */
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

#playButton {
    font-family: 'YourFont', sans-serif;
    padding: 15px 30px;
    margin: 10px 0;
    background-color: #007bff;
    color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: none;
    cursor: pointer;
}

#ticketsInfo {
    font-size: 18px;
    margin: 10px 0;
    color: #000;
}

.comingSoon {
    font-family: 'YourFont', sans-serif;
    padding: 10px 20px;
    margin: 10px;
    background-color: #ffc107;
    color: #000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: none;
    cursor: pointer;
}

#gameContainer {
    flex-grow: 1;
    width: 100vw;
    margin: 0;
    border: none;
    background-color: transparent; /* Ensure it is transparent to show the body's background image */
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
    background-color: transparent; /* Make canvas background transparent */
}

#startScreen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#buttonContainer {
    width: 80%;
    margin: 0 auto;
    display: flex;
    height: 100%;
    justify-content: center;
    flex-direction: column;
}

#centerButton, #textButton {
    font-family: 'YourFont', sans-serif;
    padding: 15px 30px;
    margin: 10px 0;
    background-color: #007bff;
    color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

#userInfo {
    position: absolute;
    top: 5px;
    left: 5px;
    color: #000;
    font-size: 18px;
    background-color: #fff;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

#points {
    position: absolute;
    top: 5px;
    right: 5px;
    color: #000;
    font-size: 18px;
    background-color: #fff;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.hidden {
    display: none;
}

#footer {
    display: flex;
    justify-content: space-around;
    background-color: #f0f0f0;
    padding: 10px 0;
    position: fixed;
    bottom: 0;
    width: 100%;
}

.footer-button {
    flex-grow: 1;
    text-align: center;
    padding: 5px 0;
    margin: 0 5px;
    background-color: transparent;
    border: none;
    cursor: pointer;
}

.footer-button img {
    max-width: 30px;
    height: auto;
}

button {
    padding: 10px 20px;
    margin: 10px;
    font-size: 16px;
    background-color: #007bff;
    color: #ffffff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #0056b3;
}
