// Constants
const TARGET_HEIGHT = 600;
const MIN_ISLAND_SPREAD = 500;
const MAX_ISLAND_SPRAD = 1000;

// Variables
let lastLoop;

// Objects
let canvas;
let context;
let swidth;
let sheight;
let cameraX = 0;
let cameraY = 0;
let world = []
let keysdown = {};

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
    // Setup canvas canvas
    console.info('Setting up canvas');
    setupCanvas(canvas, { height: TARGET_HEIGHT})
    swidth = canvas.width;
    sheight = canvas.height;

    // Setup players
    console.info('Setting up players');
    world.push(new Player(200, 100, 'player1', {right: 'ArrowRight', left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown'})); // arrow keys
    world.push(new Player(100, 100, 'player2', {right: 'KeyD', left: 'KeyA', up: 'KeyW', down: 'KeyS'})); // wasd

    // Default island
    world.push(new Island(150, 300, Math.floor(random(0, 3))))

    // Generate islands
    for (let y = 0; y < 1000; y += random(200, 300)) {
        for (let x = -MAX_ISLAND_SPRAD * 10; x < MAX_ISLAND_SPRAD * 10; x += random(MIN_ISLAND_SPREAD, MAX_ISLAND_SPRAD)) {
            if (Math.abs(x) < 500 && Math.abs(y) < 500) {
                continue;
            }
            
            world.push(new Island(x, y, Math.floor(random(0, 3))))
        }
    }


    // Start game loop
    console.info('Starting game loop');
    lastLoop = new Date().getTime();
    requestAnimationFrame(loop);
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

    // Update objects
    for (let o of world) {
        o.update(dt, world);
    }
}

function render(dt) {
    // Clear previous rendering
    context.clearRect(0, 0, swidth, sheight);

    // Render background
    let percent = Math.min(1, Math.max(cameraY, 0) / 1000);
    renderBackground(context, swidth, sheight, [50, 150, 200], [5, 15, 100], percent);

    // Order by zRender
    world.sort((a, b) => {
        return b.zRender - a.zRender;
    })

    // Render objects
    for (let o of world) {
        o.render(context);
    }
}

function loop() {
    // Calculate dt
    let now = new Date().getTime();
    let dt = (now - lastLoop) / 1000;

    // Events
    input(dt);
    update(dt);
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
    setupCanvas(canvas, { height: TARGET_HEIGHT})
    swidth = canvas.width;
    sheight = canvas.height;
}

window.onkeydown = (e) => {
    let code = e.code;
    keysdown[code] = true;
    console.log(code);
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