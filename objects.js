class Player {

    constructor(x, y, name, keymap) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = 64;
        this.h = 64;
        this.cw = 32;
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
        this.curLadder = null;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, Math.floor(this.frame), 4);

        // context.fillStyle = "#FF000022";
        // context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
    }

    input(dt, world) {
        const moveSpeed = 3000;

        if (this.onGround || !this.onLadder) {
            // Handle controls
            if (this.keymap.left && isKeyDown(this.keymap.left)) { // left
                this.vx -= moveSpeed * dt;
            }
            if (this.keymap.right && isKeyDown(this.keymap.right)) { // right
                this.vx += moveSpeed * dt;
            }
            if (this.keymap.up && isKeyDown(this.keymap.up) &&
                this.onGround && canPlaceLadder(world, this.x, this.y + 5)) { // ladder up (todo: permissions)
                world.push(new Ladder(this.x, this.y + 5, 0));
            }
        }

        if (this.onLadder) {
            let newLadder;
            if (this.curLadder && this.nextLadder && this.curLadder != this.nextLadder) {
                return;
            }

            if (this.keymap.up && isKeyDown(this.keymap.up)) {
                if (this.curLadder.top) {
                    this.nextLadder = this.curLadder.top;
                    return;
                }
                if (!canPlaceLadder(world, this.curLadder.x, this.curLadder.y - 64)) {
                    return;
                }
                newLadder = new Ladder(this.curLadder.x, this.curLadder.y - 64, 0);
                this.curLadder.top = newLadder;
                newLadder.bottom = this.curLadder;
            }
            if (this.keymap.down && isKeyDown(this.keymap.down) && !this.onGround) {
                if (this.curLadder.bottom) {
                    this.nextLadder = this.curLadder.bottom;
                    return;
                }
                if (!canPlaceLadder(world, this.curLadder.x, this.curLadder.y + 64)) {
                    return;
                }
                newLadder = new Ladder(this.curLadder.x, this.curLadder.y + 64, 0);
                this.curLadder.bottom = newLadder;
                newLadder.top = this.curLadder;
            }
            if (this.keymap.right && isKeyDown(this.keymap.right) && !this.onGround) {
                if (this.curLadder.right) {
                    this.nextLadder = this.curLadder.right;
                    return;
                }
                if (!canPlaceLadder(world, this.curLadder.x + 64, this.curLadder.y)) {
                    return;
                }
                if (this.curLadder.top && this.curLadder.bottom) {
                    return;
                }
                newLadder = new Ladder(this.curLadder.x + 64, this.curLadder.y, 1);
                this.curLadder.right = newLadder;
                newLadder.left = this.curLadder;
            }
            if (this.keymap.left && isKeyDown(this.keymap.left) && !this.onGround) {
                if (this.curLadder.left) {
                    this.nextLadder = this.curLadder.left;
                    return;
                }
                if (!canPlaceLadder(world, this.curLadder.x - 64, this.curLadder.y)) {
                    return;
                }
                if (this.curLadder.top && this.curLadder.bottom) {
                    return;
                }
                newLadder = new Ladder(this.curLadder.x - 64, this.curLadder.y, 1);
                this.curLadder.left = newLadder;
                newLadder.right = this.curLadder;
            }

            if (newLadder) {
                this.nextLadder = newLadder;
                world.push(newLadder);
            }
        }
    }

    update(dt, world) {

        // Gravity
        if (!this.onLadder || this.onGround) {
            this.vy += 980 * dt;
        } else {
            this.vy = this.vy * 0.8;
        }

        // Movement
        if (this.onLadder && this.curLadder && this.nextLadder && this.curLadder != this.nextLadder) {
            let distX = this.nextLadder.x - this.x;
            let distY = this.nextLadder.y - this.y;
            if (Math.abs(distX) <= 5 && Math.abs(distY) <= 5) {
                this.curLadder = this.nextLadder;
            } else {
                this.vx = distX * 10;
                this.vy = distY * 10;

                if (this.vy > 0) {
                    this.vy *= 1.2; // 20% faster
                }
            }
        }

        // Friction
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
                    this.onLadder = false;
                }
                if (obj.type == 'player') {
                    this.onLadder = false;
                }
            }

            // Colliding! Stop
            if (Math.abs(distX + dx) < maxW && Math.abs(distY) < maxH) {
                dx = 0;
                this.vx = 0;
                if (obj.type == 'player') {
                    this.onLadder = false;
                }
            }
        }

        // Is on ground?
        if (this.onGround) {
            this.onLadder = false;
            this.curLadder = null;
            this.nextLadder = null;
            let ladders = world.filter(o => o.type == 'ladder')
            for (let ladder of ladders) {
                if (Math.abs(ladder.x - this.x) < 10 && Math.abs(ladder.y - this.y) < 10) {
                    this.onLadder = true;
                    this.curLadder = ladder;
                }
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

        // context.fillStyle = "#FFFFFF22";
        // context.fillRect(this.x - this.cw / 2, this.y - this.ch / 2, this.cw, this.ch);
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
        this.left = null;
        this.right = null;
        this.top = null;
        this.bottom = null;
    }

    render(context) {
        drawFrame(context, this.name, this.x, this.y, this.w, this.h, this.frame, 3);
    }

    update() {
        //stub
        let vert = this.top != null || this.bottom != null;
        let horiz = this.left != null || this.right != null;
        if (vert && horiz) {
            this.frame = 2;
        }
    }
}