import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Physics } from 'phaser';

export class Game extends Scene
{
    player;
    cursors;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x028af8);
        this.add.image(540, 540, 'background');

        this.cursors = this.input.keyboard.createCursorKeys();
        


        
        this.player = this.physics.add.sprite(540, 540, this.registry.get('playerModel'));
        this.physics.world.enable(this.player);
        this.physics.enableUpdate();

        EventBus.emit('current-scene-ready', this);


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
