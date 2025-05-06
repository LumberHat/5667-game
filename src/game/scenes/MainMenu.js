import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene {
    logoTween;

    constructor() {
        super('MainMenu');
    }

    create() {
        this.add.image(540, 540, 'background');
        var startButton = this.add.text(512, 1080 - 140, 'PLAY', {
            font: 'bold 100px Comic Sans MS',
            fill: '0x000000',
            stroke: '#FFFFFF',
            strokeThickness: 8,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 2, fill: true }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            this.tweens.add({
                targets: startButton,
                scale: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    this.registry.set('playerModel', characterSelector.character);
                    this.scene.start('Game');
                }
            });
        });
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
            startButton.setFill('#FFFFFF');
            startButton.setStroke('#000000', 8);
        });
        startButton.on('pointerout', () => {
            startButton.setScale(1);
            startButton.setFill('#000000');
            startButton.setStroke('#FFFFFF', 8);
        });
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
    characterList = ['cheddar_bob', 'goober', 'thompson']; //list characters by their file name (exclude extension)
    character = this.characterList[0]; //selected character
    characterObjects = []; //objects representing characters
    selector;

    constructor(scene, x, y, children) {
        super(scene, x, y, children);


        this.selector = scene.add.image(x, y, 'selector');
        var calcY = (i) => { return y + (this.characterIconSize[1] + 20) * i; }

        for (let i = 0; i < this.characterList.length; i++) {
            //create interactive game object for each character
            this.characterObjects[i] = scene.add.image(x, calcY(i),
                this.characterList[i]).setInteractive();
            //controls space between icons


            //set each character as a button
            this.characterObjects[i].on('pointerdown', () => {
                this.character = this.characterList[i];
                this.selector.setPosition(x, calcY(i));
                console.log('selected: ' + this.character);
            }
            )
        }
    }
}