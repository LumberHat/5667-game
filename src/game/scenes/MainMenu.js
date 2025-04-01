import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(540, 540, 'background');
        var startButton = this.add.image(512, 1080-140, 'main_menu').setInteractive();
        var characterSelector = new CharacterSelectorContainer(this, 512, 320);

        EventBus.emit('current-scene-ready', this);
        //enable startbutton 
        startButton.on('pointerdown', () => {
            this.registry.set('playerModel', characterSelector.character);
            this.scene.start('Game');
        })
    }
}
class CharacterSelectorContainer extends Phaser.GameObjects.Container {
    
    characterIconSize = [128, 128];
    characterList = [ 'cheddar_bob', 'goober', 'thompson']; //list characters by their file name (exclude extension)
    character = this.characterList[0]; //selected character
    characterObjects = []; //objects representing characters
    selector;

    constructor(scene, x, y, children) {
        super(scene, x, y ,children);
        
        
        this.selector = scene.add.image(x, y, 'selector');
        var calcY = (i) => {return y + (this.characterIconSize[1] + 20) * i;}

        for (let i = 0; i < this.characterList.length; i++) {
            //create interactive game object for each character
            this.characterObjects[i] = scene.add.image(x, calcY(i), 
                this.characterList[i]).setInteractive();
            //controls space between icons
            

            //set each character as a button
            this.characterObjects[i].on('pointerdown', () => 
                {
                    this.character = this.characterList[i];
                    this.selector.setPosition(x, calcY(i));
                    console.log('selected: ' + this.character);
                }
            )
        }
    }
}