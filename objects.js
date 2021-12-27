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
        this.onGround = false;
        this.onLadder = false;
        this.ladderDir = 0;
        this.prevLadder = null;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, Math.floor(this.frame), 4);

        context.fillStyle = "#FF000022";
        context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    input(dt, world) {
        const moveSpeed = 3000;

        // Handle controls
        if (this.keymap.left && isKeyDown(this.keymap.left)) {
            this.vx -= moveSpeed * dt;
        }
        if (this.keymap.right && isKeyDown(this.keymap.right)) {
            this.vx += moveSpeed * dt;
        }
        if (this.keymap.up && isKeyDown(this.keymap.up)) {
            if (this.onLadder && this.ladderDir == 0) {
                this.vy -= moveSpeed * dt;
            }
        }
        if (this.keymap.down && isKeyDown(this.keymap.down)) {
            if (this.onLadder && this.ladderDir == 0) {
                this.vy += moveSpeed * dt;
            }
        }
        if (this.keymap.buildUp && isKeyDown(this.keymap.buildUp)) {
            if (this.onGround && !this.onLadder) {
                // create a ladder
                let ladder = new Ladder(this.x, this.y, 0);
                world.push(ladder);
            }

            if (!this.onLadder && this.prevLadder) {
                // Check distance
                let distX = this.prevLadder.x - this.x;
                if (Math.abs(distX) >= this.w / 2) {
                    return;
                }

                // create a ladder
                let ladder = new Ladder(this.prevLadder.x, this.prevLadder.y - 64, 0);
                world.push(ladder);
            }
        }
    }

    update(dt, world) {

        // Gravity
        if (!this.onLadder) {
            this.vy += 980 * dt;
        } else {
            this.vy = this.vy * 0.8;
        }
        
        this.vx = this.vx * 0.8;

        let dx = this.vx * dt;
        let dy = this.vy * dt;

        // Collisions
        this.onGround = false;
        for (let obj of world) {
            // Ignoring myself
            if (obj == this) continue;

            // No collisions
            if (!obj.cw || !obj.ch) continue;

            // Overlap?
            let distX = this.x - obj.x;
            let distY = this.y - obj.y;
            let maxW = (this.cw + obj.cw) / 2;
            let maxH = (this.ch + obj.ch) / 2;

            // Colliding! Stop
            if (Math.abs(distX) < maxW && Math.abs(distY + dy) < maxH) {
                dy = 0;
                this.vy = 0;

                if (obj.type == 'island') {
                    this.onGround = true;
                    this.prevLadder = null;
                }
            }

            // Colliding! Stop
            if (Math.abs(distX + dx) < maxW && Math.abs(distY) < maxH) {
                dx = 0;
                this.vx = 0;
            }
        }

        // Ladders
        this.onLadder = false;
        let ladders = world.filter(o => o.type == 'ladder');
        for (let ladder of ladders) {
            let distX = this.x - ladder.x;
            let distY = this.y - ladder.y;
            if (Math.abs(distX) <= this.w/2 && Math.abs(distY) <= this.h) {
                this.onLadder = true;
                this.prevLadder = ladder;
                this.ladderDir = ladder.frame;
            }
        }

        // Animation
        if (Math.abs(this.vx) > 100 || (Math.abs(this.vy) > 100 && this.onLadder)) {
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
        this.type = 'island';
        this.zRender = 10;
        this.zUpdate = 10;

        if (this.frame == 0) {
            this.cw = 200;
        } else if (this.frame == 1) {
            this.cw = 160;
        } else {
            this.cw = 180;
        }
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, this.frame, 3);

        context.fillStyle = "#FFFFFF22";
        context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    update() {
        //stub
    }
}


class Ladder {
    constructor(x, y, frame) {
        this.x = x;
        this.y = y;
        this.w = 64;
        this.h = 64;
        this.frame = frame;
        this.name = 'ladder';
        this.type = 'ladder';
        this.zRender = 2;
        this.zUpdate = 2;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, this.frame, 3);

        context.fillStyle = "#FFFFFF22";
        context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    update() {
        //stub
    }
}