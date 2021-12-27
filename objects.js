class Player {

    constructor(x, y, name, keymap) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = 64;
        this.h = 64;
        this.cw = 64;
        this.ch = 64;
        this.frame = 0;
        this.name = name;
        this.type = 'player'
        this.zRender = 0;
        this.zUpdate = 0;
        this.keymap = keymap;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, Math.floor(this.frame), 4);

        context.fillStyle = "#FF000022";
        context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    input(dt, world) {
        const moveSpeed = 2000;

        // Handle controls
        if (this.keymap.left && isKeyDown(this.keymap.left)) {
            this.vx -= moveSpeed * dt;
        }
        if (this.keymap.right && isKeyDown(this.keymap.right)) {
            this.vx += moveSpeed * dt;
        }
        if (this.keymap.up && isKeyDown(this.keymap.up)) {
            this.vy -= moveSpeed * dt;
        }
        if (this.keymap.down && isKeyDown(this.keymap.down)) {
            this.vy += moveSpeed * dt;
        }
    }

    update(dt, world) {

        // Gravity
        this.vy += 980 * dt;
        this.vx = this.vx * 0.9;

        let dx = this.vx * dt;
        let dy = this.vy * dt;

        // Collisions
        for (let obj of world) {
            // Ignoring myself
            if (obj == this) continue;

            // Overlap?
            let distX = this.x - obj.x;
            let distY = this.y - obj.y;
            let maxW = (this.cw + obj.cw) / 2;
            let maxH = (this.ch + obj.ch) / 2;

            // Colliding! Stop
            if (Math.abs(distX) < maxW && Math.abs(distY + dy) < maxH) {
                dy = 0;
                this.vy = 0;
            }

            // Colliding! Stop
            if (Math.abs(distX + dx) < maxW && Math.abs(distY) < maxH) {
                dx = 0;
                this.vx = 0;
            }
        }

        // Animation
        if (Math.abs(this.vx) > 100) {
            this.frame += 12 * dt;
            if (this.frame >= 4) {
                this.frame = 0;
            }
        } else {
            this.frame = 0;
        }


        // Actual movement
        this.x += dx;
        this.y += dy;
    }

    collisionBox() {
        return {
            x1: this.x - this.w / 2,
            y1: this.y - this.h / 2,
            x2: this.x + this.w / 2,
            y2: this.y + this.h / 2
        };
    }
}

class Island {

    constructor(x, y, frame) {
        this.x = x;
        this.y = y;
        this.w = 256;
        this.h = 256;
        this.cw = 256;
        this.ch = 16;
        this.frame = frame;
        this.name = 'island';
        this.zRender = 1;
        this.zUpdate = 1;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, this.frame, 3);

        context.fillStyle = "#FFFFFF22";
        context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    update() {
        //stub
    }

    collisionBox() {
        return {
            x1: this.x - this.w / 2,
            y1: this.y,
            x2: this.x + this.w / 2,
            y2: this.y + this.h / 2
        }
    }
}