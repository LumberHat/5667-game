import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Physics } from 'phaser';

export class Game extends Scene {
    player;
    cursors;
    bombs = [];

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x028af8);
        this.add.image(540, 540, 'background');
        this.background = this.add.tileSprite(0, 0, 1920, 2000, 'background').setOrigin(0, 0);
        this.physics.world.setBounds(0, 0, 1920, 2000); 
        this.cameras.main.setBounds(0, 0, 1920, 2000);
        // setup input
        this.cursors = this.input.keyboard.createCursorKeys(); // arrow keys  
        this.input.on('pointerdown', this.placeBombAtCursor, this); // clicks
        var spacebar = this.input.keyboard.addKey("Space"); // Get key object
        spacebar.on("down", this.detonateBombs, this);

        this.player = this.physics.add.sprite(540, 540, this.registry.get('playerModel'));
        this.physics.world.enable(this.player);
        this.physics.enableUpdate();

        this.player.body.setGravityY(200); // Set gravity for the player
        this.player.setBounce(0.2); // Set bounce for the player
        this.player.setCollideWorldBounds(true); // Prevent the player from going out of bounds


        const floor = this.add.rectangle(540, 1300, 4000, 500, 0x8B4513); 
        this.physics.add.existing(floor, true); 

        const platform = this.physics.add.staticSprite(540, 700, 'platform');
        platform.setScale(2, 0.5).refreshBody();

        // Add collision 
        this.physics.add.collider(this.player, platform);
        this.physics.add.collider(this.player, floor);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(.8);
        this.cameras.main.setDeadzone(200, 200);

        EventBus.emit('current-scene-ready', this);
    }

    detonateBombs() {
        for (let i = 0; i < this.bombs.length; i++) {
            this.bombs[i].detonate(this.player);
            console.log(this.bombs[i]);
        }
        this.bombs = [];
    }

    placeBombAtCursor() {
        var pointer = this.input.activePointer;


        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        console.log('click detected at world position:', worldX, worldY);
        this.placeBomb(worldX, worldY);
    }

    placeBomb(x, y) {
        console.log('placed bomb at ' + x + " " + y);
        this.bombs.push(new Bomb(this, x, y));
    }

    update() {
        const { left, right, down } = this.cursors;

        if (left.isDown) {
            this.player.setVelocityX(-160);
        }
        else if (right.isDown) {
            this.player.setVelocityX(160);
        }
        else if (down.isDown) {
            this.player.setVelocityX(0);
        }
        else if (this.player.body.touching.down) {
            this.player.setVelocityX(this.player.body.velocity.x * 0.9); // Apply friction
        }
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}

class Bomb extends Phaser.GameObjects.Sprite {

    force = 1000;
    falloff = 150;
    sprite;


    constructor(scene, x, y) {
        super(scene, x, y);
        this.sprite = scene.physics.add.sprite(x, y, 'bomb');
        this.sprite.body.setGravityY(200);
    }

    detonate(player) {
        var dx = player.x - this.sprite.x;
        var dy = player.y - this.sprite.y;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        var magnitude = (Math.max((this.falloff - distance), 0) / this.falloff) * this.force;

        player.body.velocity.x += (dx / distance) * magnitude;
        player.body.velocity.y += (dy / distance) * magnitude;

        console.log('detonated at ' + this.x + " " + this.y);
        this.destroy(0);
    }

    destroy(flag) {
        this.sprite.destroy(flag);
        super.destroy();
    }
}
