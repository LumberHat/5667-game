import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/img/background.png');
        this.load.image('main_menu', 'assets/img/main_menu.png');
        this.load.image('goober', 'assets/img/goober.png');
        this.load.image('thompson', 'assets/img/thompson.png');
        this.load.image('cheddar_bob', 'assets/img/cheddar_bob.png');
        this.load.image('selector', 'assets/img/selector.png');
        this.load.image('bomb', 'assets/img/bomb.png');

    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
