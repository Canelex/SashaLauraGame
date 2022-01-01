// Constants
const TARGET_HEIGHT = 600;
const MIN_ISLAND_SPREAD = 500;
const MAX_ISLAND_SPREAD = 1000;

// Variables
let lastLoop;
let gameOver = false;
let gameLoopRunning = false;

// Objects
let canvas;
let context;
let swidth;
let sheight;
let cameraX = 0;
let cameraY = 0;
let world = []
let keysdown = {};
let waterLevel = 0;
let waterLevelSpeed = 0;
let waterLevelAngle = 0;
let score = 0;
let maxScore = 0;

function preinit() {
    // Get the canvas
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    // Load assets
    let promises = [];
    promises.push(loadImage('player1', 'player1.png'));
    promises.push(loadImage('player2', 'player2.png'));
    promises.push(loadImage('island', 'island.png'));
    promises.push(loadImage('ladder', 'ladder.png'));

    // Once everything is loaded
    Promise.all(promises).then(() => {
        // Initialize game
        console.info('Initializing game');
        init();
    })
}

function init() {
    // Clear the world
    world = [];
    gameOver = false;
    score = 0;

    // Setup canvas canvas
    console.info('Setting up canvas');
    setupCanvas(canvas, { height: TARGET_HEIGHT })
    swidth = canvas.width;
    sheight = canvas.height;
    cameraX = -swidth / 2;
    cameraY = -sheight / 2
    waterLevel = -sheight + 100;
    waterLevelAngle = Math.random() * Math.PI * 2;
    waterLevelSpeed = 0;

    // Setup players
    console.info('Setting up players');
    world.push(new Player(50, 100, 'player2', { right: 'ArrowRight', left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown'})); // arrow keys
    world.push(new Player(-50, 100, 'player1', { right: 'KeyD', left: 'KeyA', up: 'KeyW', down: 'KeyS'})); // wasd

    // Default island
    world.push(new Island(0, 300, Math.floor(random(0, 3))))

    // Generate islands
    for (let y = 0; y < 5280; y += random(200, 300)) {
        for (let x = -MAX_ISLAND_SPREAD * 10; x < MAX_ISLAND_SPREAD * 10; x += random(MIN_ISLAND_SPREAD, MAX_ISLAND_SPREAD)) {
            if (Math.abs(x) < 500 && Math.abs(y) < 500) {
                continue;
            }

            world.push(new Island(x, -y, Math.floor(random(0, 3))))
            world.push(new Item(x, -y - 50, Math.floor(random(0, 3))))
        }
    }


    // Start game loop
    console.info('Starting game loop');
    lastLoop = new Date().getTime();
    if (!gameLoopRunning) {
        requestAnimationFrame(loop);
    }
    gameLoopRunning = true;
}

function input(dt) {

    // Handle player input
    let players = world.filter(o => o.type == 'player');
    for (let player of players) {
        player.input(dt, world);
    }
}

function update(dt) {

    // Order by zUpdate
    world.sort((a, b) => {
        return b.zUpdate - a.zUpdate;
    })

    // Update camera
    let cameraTargetX = 0;
    let cameraTargetY = 0;
    let numPlayers = 0;

    // Update objects
    for (let o of world) {
        o.update(dt, world);

        if (o.type == 'player') {
            cameraTargetX += o.x;
            cameraTargetY += o.y;
            numPlayers++;

            if (-o.y < waterLevel) {
                gameOver =true;
            }
        }
    }

    // Raise water level
    waterLevelSpeed += 0.5 * dt;
    waterLevel += waterLevelSpeed * dt;
    waterLevelAngle += 1 * dt;

    cameraTargetX /= numPlayers;
    cameraTargetY /= numPlayers;

    if (cameraTargetX > 5000) {
        cameraTargetX = 5000;
    }
    if (cameraTargetX < -5000) {
        cameraTargetX = 5000;
    }

    score = Math.max(score, -Math.round(cameraTargetY));
    maxScore = Math.max(maxScore, score);

    cameraTargetX -= swidth / 2;
    cameraTargetY -= sheight / 2
    cameraX = Math.round((cameraTargetX - cameraX) * 0.1 + cameraX);
    cameraY = Math.round((cameraTargetY - cameraY) * 0.1 + cameraY);
}

function render(dt) {
    // Clear previous rendering
    context.clearRect(0, 0, swidth, sheight);

    // Render background
    let percent = Math.min(1, Math.max(-cameraY, 0) / 5280);
    renderBackground(context, swidth, sheight, [50, 150, 200, 255], [5, 15, 100, 200], percent);

    // Move by camera
    context.translate(-cameraX, -cameraY);

    // Order by zRender
    world.sort((a, b) => {
        return b.zRender - a.zRender;
    })

    // Render objects
    for (let o of world) {
        o.render(context);
    }
    
    // Draw water layers
    let colors = ['#00115555', '#00223355', '#00335588'];
    let ratios = [90, -35, 50];
    let xoff = [-300, 100, 400];
    let yoff = [0, -5, 10];
    for (let i in colors) {
        let angle = Math.sin(waterLevelAngle) / ratios[i];
        context.rotate(angle);
        context.translate(-5000, -waterLevel);
        context.fillStyle = colors[i];
        context.fillRect(xoff[i], yoff[i], 10000, 10000)
        context.translate(5000, waterLevel);
        context.rotate(-angle);
    }

    // Move back
    context.translate(cameraX, cameraY);

    let text = "Score: " + score;
    drawText(context, text, '#000', 10, 32, 32);
    drawText(context, text, '#FFF', 10, 30, 30);
    let best = "Best: " + maxScore;
    drawText(context, best, '#000', 10, 32, 62);
    drawText(context, best, '#FFF', 10, 30, 60);

    if (gameOver) {
        drawCenteredText(context, "Game Over!", '#000', 50, swidth / 2 + 5, sheight / 2 - 145);
        drawCenteredText(context, "Game Over!", '#FFF', 50, swidth / 2, sheight / 2 - 150);
        drawCenteredText(context, "Press Space to Restart", '#000', 15, swidth / 2 + 2, sheight - 138);
        drawCenteredText(context, "Press Space to Restart", '#FFF', 15, swidth / 2, sheight - 140);
    }
}

function loop() {
    // Calculate dt
    let now = new Date().getTime();
    let dt = (now - lastLoop) / 1000;

    // Maximum dt
    if (dt > 1 / 30) {
        dt = 1 / 30;
    }

    // Events
    if (!gameOver) {
        input(dt);
        update(dt);
    }
    render(dt);

    // Update time
    lastLoop = now;
    requestAnimationFrame(loop);
}

// Preinit
preinit();

// Events
window.onresize = () => {
    // Setup canvas
    console.info('Reformating up canvas');
    setupCanvas(canvas, { height: TARGET_HEIGHT })
    swidth = canvas.width;
    sheight = canvas.height;
}

window.onkeydown = (e) => {
    let code = e.code;
    keysdown[code] = true;
    console.log(code);

    if (code == "Space" && gameOver) {
        init();
    }
}

window.onkeyup = (e) => {
    let code = e.code;
    keysdown[code] = false;
}

function isKeyDown(code) {
    return keysdown[code];
}

function random(min, max) {

    return Math.random() * (max - min) + min;
}

function canPlaceLadder(world, x, y) {
    for (let o of world) {
        let dx = x - o.x;
        let dy = y - o.y;
        if (o.type == 'ladder') {
            if (Math.abs(dx) < 63 && Math.abs(dy) < 63) {
                return false;
            }
        }
    }

    return true;
}