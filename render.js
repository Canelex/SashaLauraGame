let images = {};

// Setup the canvas
function setupCanvas(canvas, opts) {
    // Get dimensions and adjust
    let scale = opts.height / Math.max(1, window.innerHeight);
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;

    let context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
}

// Load image
function loadImage(name, src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => {
            images[name] = img;
            console.info('Loaded image', src);
            resolve();
        }
        img.onerror = () => {
            console.error('Failed to load', src);
            reject();
        }
        img.src = src;
    });
}

// Draw frame
function drawFrame(context, name, x, y, w, h, frame, totalFrames) {
    let img = images[name];

    // Validate image
    if (!img) {
        console.error('Tried to draw image that was not loaded');
        return;
    }

    // Get image dimensions
    let srcWidth = img.width;
    let srcHeight = img.height;
    let frameHeight = srcHeight / totalFrames;

    // Render the image
    context.drawImage(img, 0, frame * frameHeight, srcWidth, frameHeight, x - w / 2, y - h / 2, w, h);
}

// Render background
function renderBackground(context, width, height, from, to, percent) {
    // Lerp color
    let curr = [Math.round(from[0] + (to[0] - from[0]) * percent),
    Math.round(from[1] + (to[1] - from[1]) * percent),
    Math.round(from[2] + (to[2] - from[2]) * percent)]
    
    // Convert to hex
    let color = '#';
    for (let c of curr) {
        let str = c.toString(16);
        if (str.length == 1) str = '0' + str;
        color += str;
    }

    // Render background
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
}