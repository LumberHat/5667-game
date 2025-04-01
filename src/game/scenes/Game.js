import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Physics } from 'phaser';

export class Game extends Scene
{
    player;
    cursors;
    bombs = [];

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x028af8);
        this.add.image(540, 540, 'background');
        // setup input
        this.cursors = this.input.keyboard.createCursorKeys(); // arrow keys  
        this.input.on('pointerdown', this.placeBombAtCursor, this); // clicks
        var spacebar = this.input.keyboard.addKey("W"); // Get key object
        spacebar.on("down", this.detonateBombs, this);

        this.player = this.physics.add.sprite(540, 540, this.registry.get('playerModel'));
        this.physics.world.enable(this.player);
        this.physics.enableUpdate();

        EventBus.emit('current-scene-ready', this);
    }

    detonateBombs () 
    {
        for (let i = 0; i < this.bombs.length; i++) {
            this.bombs[i].detonate(this.player);
            console.log(this.bombs[i]);
        }
        this.bombs = [];
    }
    
    placeBombAtCursor ()
    {
        var pointer = this.input.activePointer;
        console.log('click detected');
        this.placeBomb(pointer.x, pointer.y);
    }

    placeBomb (x, y)
    {
        console.log('placed bomb at ' + x + " " + y);
        this.bombs.push(new Bomb(this, x, y));
    }

    update ()
    {
        const { left, right, down } = this.cursors;

        if (left.isDown)
        {
            this.player.setVelocityX(-160);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(160);
        }
        else if (down.isDown)
        {
            this.player.setVelocityX(0);
        }
        else if (this.player.body.touching.down)
        {
            this.player.setVelocityX(0);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}

class Bomb extends Phaser.GameObjects.Sprite {

    force = 1000;
    falloff = 150; 
    sprite;

    constructor (scene, x, y) {
        super(scene, x, y);
        this.sprite = scene.add.sprite(x, y, 'bomb');
    }

    detonate (player) {
        var dx = player.x - this.x;
        var dy = player.y - this.y;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        var magnitude = (Math.max((this.falloff - distance), 0) / this.falloff) * this.force;

        player.body.velocity.x += (dx / distance) * magnitude;
        player.body.velocity.y += (dy / distance) * magnitude;

        console.log('detonated at '+this.x+" "+this.y);
        this.destroy(0);
    }

    destroy (flag) {
        this.sprite.destroy(flag);
        super.destroy();
    }
}
