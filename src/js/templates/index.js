(async () => {
    const PIXI = await import("pixi.js");
    PIXI.sound = await import("pixi-sound");

    PIXI.settings.ROUND_PIXELS = true;
    PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    /// Classes
    // Volume button
    class VolumeButton extends PIXI.Sprite {
        constructor(textures) {
            super(textures[3]);
            this.volume = 3;
            this.textures = textures;

            let scaling = 0.242 * 0.902;
            this.scale.set(scaling, scaling);
            this.position.set(164.6 + 2 * scaling, 112.9 + 2 * scaling);
            this.anchor.set(0.5, 0.5);
            this.interactive = true;
            this.buttonMode = true;

            this.on("pointertap", this.shiftVolume);
        }

        shiftVolume() {
            if (this.volume >= 3) {
                this.volume = 0;
            } else {
                this.volume++;
            }

            this.texture = this.textures[this.volume];
        }
    }

    // Variables
    let frame = 0;
    let volumeBtn;

    // Setup
    const FPS = 24;
    let last = 0;
    const interval = (1e3 / FPS) | 0; // Fix occasional drop-off frames
    const APP_WIDTH = 950;
    const APP_HEIGHT = 650;
    const ATLAS_AMOUNT = 38;

    const loader = PIXI.Loader.shared;
    const app = new PIXI.Application({
        width: APP_WIDTH,
        height: APP_HEIGHT,
        antialias: true,
        transparent: true,
        resolution: 1,
    });

    document.body.appendChild(app.view);

    const standardTextStyle = new PIXI.TextStyle({
        fontFamily: "Courier New",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#000000",
        align: "center",
    });

    // Preloader text
    let preloaderText = new PIXI.Text(`Loading...`, standardTextStyle);
    preloaderText.position.set(APP_WIDTH / 2, APP_HEIGHT / 2);
    preloaderText.anchor.set(0.5, 0.5);
    app.stage.addChild(preloaderText);

    // Asset loading
    const audio = {};
    const sprites = {};

    loader.baseUrl = "./assets/";
    loader.onError.add((e) => {
        console.error(e);
    });
    loader.onProgress.add((e) => {
        preloaderText.text = `Loading textures.\n${Math.floor(
            loader.progress
        )}%`;
    });

    // Load atlases
    for (let i = 0; i <= ATLAS_AMOUNT; i++) {
        loader.add(`atlas-${i}.json`, `atlases/atlas-${i}.json`);
    }

    // Load audio
    loader
        .add("drama", "audio/drama.mp3")
        .add("heartbeat", "audio/heartbeat.mp3")
        .add("the-furthest-ring", "audio/the-furthest-ring.mp3");

    loader.load((loader, resources) => {
        const gifs = {};
        const textures = {};

        preloaderText.text = "Constructing sprites.";

        // Audio
        audio["drama"] = resources["drama"].sound;
        audio["heartbeat"] = resources["heartbeat"].sound;
        audio["the-furtest-ring"] = resources["the-furthest-ring"].sound;

        // Automatically create all sprites
        for (let i = 0; i <= ATLAS_AMOUNT; i++) {
            Object.entries(resources[`atlas-${i}.json`].textures).forEach(
                (texture) => {
                    let name = "";

                    if (
                        texture[0].endsWith(".gif") ||
                        texture[0].includes("ani")
                    ) {
                        name = texture[0].substr(
                            0,
                            texture[0].lastIndexOf("-")
                        );
                        if (!gifs[name]) gifs[name] = [];

                        const frame = parseInt(
                            texture[0].substr(
                                texture[0].lastIndexOf("-") + 1,
                                texture[0].lastIndexOf(".")
                            )
                        );
                        while (gifs[name].length < frame) {
                            gifs[name].push(undefined);
                        }

                        gifs[name][frame] = texture[1];
                    } else {
                        name = texture[0].substr(
                            0,
                            texture[0].lastIndexOf(".")
                        );

                        sprites[name] = new PIXI.Sprite(texture[1]);
                    }

                    textures[name] = texture[1];
                }
            );
        }

        // Create GIFs
        Object.entries(gifs).forEach((texture) => {
            sprites[texture[0]] = new PIXI.AnimatedSprite(texture[1]);
        });

        // Add starter
        const starter = new PIXI.Graphics();
        starter.beginFill(0xffffff);
        starter.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
        starter.endFill();
        starter.interactive = true;
        starter.on("pointertap", () => {
            frame++;
            starter.destroy();
        });
        app.stage.addChildAt(starter, 0);

        // Add volume control
        volumeBtn = new VolumeButton([
            textures["volume-0"],
            textures["volume-1"],
            textures["volume-2"],
            textures["volume-3"],
        ]);
        app.stage.addChild(volumeBtn);

        preloaderText.text = "Click anywhere to start.";
        requestAnimationFrame(update);
    });

    /// Animation
    // Panel box
    const panelBox = new PIXI.Graphics();
    panelBox.beginFill(0x000000);
    panelBox.drawRect(150, 100, 650, 450);
    panelBox.endFill();

    const animate = () => {
        // TODO: Write some code to play timelines in here
        switch (frame) {
            case 1:
                app.stage.addChildAt(panelBox, 0);
                frame++;
                break;
        }
    };

    const update = () => {
        requestAnimationFrame(update);

        const now = performance.now() | 0; // Fix occasional drop-off frames
        const elapsed = now - last;

        if (elapsed < interval) return;

        animate();

        // Excellent
        last = now - (elapsed % interval);
    };
})();
