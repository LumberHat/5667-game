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
    // playFabBaseUrl = 'https://invalidurl.playfabapi.com';
    debugText;

    constructor() {
        super('Game');
        this.platforms = [];
        this.bombsAvailable = 3;
    }

    async create() {
        this.cameras.main.setBackgroundColor(0x028af8);
        this.add.image(540, 540, 'background');
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.background.displayWidth = 1920;
        this.background.displayHeight = 5000;
        this.physics.world.setBounds(0, 0, 1920, 5000);
        this.cameras.main.setBounds(0, 0, 1920, 5000);

        // setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', this.placeBombAtCursor, this);
        var spacebar = this.input.keyboard.addKey("Space");
        spacebar.on("down", this.detonateBombs, this);

        this.player = this.physics.add.sprite(540, 4500, this.registry.get('playerModel'));
        this.physics.world.enable(this.player);
        this.physics.enableUpdate();

        this.player.body.setGravityY(500);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Create floor
        this.floor = this.add.rectangle(540, 4900, 4000, 500, 0x8B4513);
        this.physics.add.existing(this.floor, true);

        // Create platforms
        new Platform(this, 540, 700, 'platform', 2, 0.5);
        new Platform(this, 700, 1100, 'platform', 0.5, 0.5);
        new Platform(this, 300, 1500, 'platform', 0.5, 0.5);
        new Platform(this, 900, 1900, 'platform', 1, 0.5);
        new Platform(this, 400, 2300, 'platform', 1.8, 0.5);
        new Platform(this, 800, 2700, 'platform', 2, 0.5);
        new Platform(this, 200, 3100, 'platform', 1.5, 0.5);
        new Platform(this, 1000, 3500, 'platform', 2.2, 0.5);
        new Platform(this, 600, 3900, 'platform', 1.7, 0.5);
        new Platform(this, 500, 4300, 'platform', 2, 0.5);

        // Set up colliders with callback
        this.physics.add.collider(this.player, this.floor, () => this.resetBombs(), null, this);
        this.platforms.forEach(platform => {
            this.physics.add.collider(this.player, platform, () => this.resetBombs(), null, this);
        });

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(0.8);
        this.cameras.main.setDeadzone(200, 200);

        new Item(this, 5600, 700, 'coin');
        // new Item(this, 5600, 4500, 'crown');

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
        const inventoryText = this.inventory.map(item => `${item.name} x${item.count}`).join(', ');
        this.debugText.setText(`Inventory: ${inventoryText}`);
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

    async loadPlayerInventory(attempt = 1) {
        if (!this.playFabId || !this.sessionTicket) {
            console.warn("No session, cannot load inventory.");
            this.inventory = [];
            return;
        }

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
            } else {
                console.warn("No inventory data found on server. Initializing empty inventory.");
                this.inventory = [];
            }
        } catch (error) {
            console.error(`Failed to load inventory (attempt ${attempt}):`, error);
            if (attempt < 2) {
                console.log("Retrying to load inventory...");
                await this.loadPlayerInventory(attempt + 1);
            } else {
                console.warn("Giving up on loading inventory. Initializing empty inventory.");
                this.inventory = [];
            }
        }
    }

    resetBombs() {
        this.bombsAvailable = 3;
        console.log('Bombs reset. Available bombs:', this.bombsAvailable);
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
        const existingItem = this.inventory.find(item => item.name === itemType);

        if (existingItem) {
            existingItem.count += 1;
        } else {
            this.inventory.push({ name: itemType, count: 1 });
        }

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
        if (this.bombsAvailable <= 0) {
            return;
        }
        if (this.bombs.length >= 3) {
            return;
        }
        const bomb = new Bomb(this, x, y);
        this.bombs.push(bomb);
        this.bombsAvailable -= 1;

        this.physics.add.collider(bomb.sprite, this.floor);
        this.platforms.forEach(platform => {
            this.physics.add.collider(bomb.sprite, platform);
        });
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
            this.player.setVelocityX(this.player.body.velocity.x * 0.9);
        }
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}

class Platform {
    constructor(scene, x, y, texture, scaleX = 1, scaleY = 1) {
        const sprite = scene.physics.add.staticSprite(x, y, texture);
        sprite.setScale(scaleX, scaleY).refreshBody();
        scene.platforms.push(sprite);
    }
}

class Bomb extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;
        this.force = 1000 / (scene.bombs.length + 1);
        this.falloff = 150;
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