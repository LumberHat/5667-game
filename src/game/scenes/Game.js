import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene {
    player;
    cursors;
    bombs = [];
    inventory = [];
    playFabId = null;
    sessionTicket = null;
    playFabTitleId = '12D945';
    playFabBaseUrl = 'https://12D945.playfabapi.com';

    constructor() {
        super('Game');
    }

    async create() {
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

        this.player.body.setGravityY(500); // Set gravity for the player
        this.player.setBounce(0.2); // Set bounce for the player
        this.player.setCollideWorldBounds(true); // Prevent the player from going out of bounds

        const floor = this.add.rectangle(540, 1300, 4000, 500, 0x8B4513);
        this.physics.add.existing(floor, true);

        const platform = this.physics.add.staticSprite(540, 700, 'platform');
        platform.setScale(2, 0.5).refreshBody();

        this.physics.add.collider(this.player, platform);
        this.physics.add.collider(this.player, floor);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(0.8);
        this.cameras.main.setDeadzone(200, 200);

        new Item(this, 600, 900, 'coin');
        
        this.debugText = this.add.text(20, 20, 'Inventory: Loading...', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setScrollFactor(0);

        await this.loginToPlayFab();
        await this.loadPlayerInventory();
        this.updateInventoryDisplay();

        EventBus.emit('current-scene-ready', this);
    }

    updateInventoryDisplay() {
        this.debugText.setText(`Inventory: ${this.inventory.join(', ')}`);
    }

    async loginToPlayFab() {
        let customId = localStorage.getItem("playfab_custom_id");
        if (!customId) {
            customId = "player_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("playfab_custom_id", customId);
        }

        try {
            const response = await fetch(`${this.playFabBaseUrl}/Client/LoginWithCustomID`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TitleId: this.playFabTitleId,
                    CustomId: customId,
                    CreateAccount: true
                })
            });

            const result = await response.json();

            if (!result.data?.PlayFabId || !result.data?.SessionTicket) {
                throw new Error("Login failed or missing data");
            }

            this.playFabId = result.data.PlayFabId;
            this.sessionTicket = result.data.SessionTicket;
            console.log("Login successful:", this.playFabId);
        } catch (error) {
            console.error("Login error:", error);
            this.add.text(100, 100, 'Login Failed: ' + error.message, {
                font: '24px Arial',
                fill: '#ff0000'
            }).setScrollFactor(0);
        }
    }

    async loadPlayerInventory() {
        if (!this.playFabId || !this.sessionTicket) return;

        try {
            const response = await fetch(`${this.playFabBaseUrl}/Client/GetUserData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorization': this.sessionTicket
                },
                body: JSON.stringify({})
            });

            const result = await response.json();

            if (result.data?.Data?.inventory?.Value) {
                this.inventory = JSON.parse(result.data.Data.inventory.Value);
                console.log("Loaded inventory:", this.inventory);
            }
        } catch (error) {
            console.error("Failed to load inventory:", error);
        }
    }

    async savePlayerInventory() {
        if (!this.playFabId || !this.sessionTicket) return;

        try {
            await fetch(`${this.playFabBaseUrl}/Client/UpdateUserData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorization': this.sessionTicket
                },
                body: JSON.stringify({
                    Data: {
                        inventory: JSON.stringify(this.inventory)
                    },
                    Permission: "Private"
                })
            });

            console.log("Inventory saved");
        } catch (error) {
            console.error("Failed to save inventory:", error);
        }
    }

    async collectItem(itemType) {
        this.inventory.push(itemType);
        this.updateInventoryDisplay();
        console.log(`Collected: ${itemType}`);
        await this.savePlayerInventory();

        const message = this.add.text(this.player.x, this.player.y - 50, `+1 ${itemType}`, {
            font: '20px Arial',
            fill: '#00ff00'
        });
        this.tweens.add({
            targets: message,
            y: message.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }

    detonateBombs() {
        for (let bomb of this.bombs) {
            bomb.detonate(this.player);
        }
        this.bombs = [];
    }

    placeBombAtCursor() {
        const pointer = this.input.activePointer;
        this.placeBomb(pointer.worldX, pointer.worldY);
    }

    placeBomb(x, y) {
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

class Item extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, itemType) {
        super(scene, x, y, itemType);
        this.itemType = itemType;
        scene.physics.world.enable(this);
        scene.add.existing(this);
        this.body.setCollideWorldBounds(true);
        scene.physics.add.overlap(scene.player, this, () => {
            scene.collectItem(this.itemType);
            this.destroy();
        });
    }
}
