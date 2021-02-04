(async () => {
    const PIXI = await import("pixi.js");

    // Setup
    const APP_WIDTH = 950;
    const APP_HEIGHT = 650;
    const ATLAS_AMOUNT = 38;

    const loader = PIXI.Loader.shared;
    const app = new PIXI.Application({
        width: APP_WIDTH,
        height: APP_HEIGHT,
        antialias: false,
        transparent: true,
        resolution: 1,
    });

    document.body.appendChild(app.view);

    const standardTextStyle = new PIXI.TextStyle({
        fontFamily: "Courier New",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#000000",
    });

    // Preloader text
    let preloaderText = new PIXI.Text(`${loader.progress}%`, standardTextStyle);
    preloaderText.position.set(APP_WIDTH / 2, APP_HEIGHT / 2);
    preloaderText.anchor.set(0.5, 0.5);
    app.stage.addChild(preloaderText);

    // Asset loading
    const sprites = {};

    loader.baseUrl = "./assets/atlases/";
    loader.onError.add((e) => {
        console.error(e);
    });
    loader.onProgress.add((e) => {
        preloaderText.text = `${Math.floor(loader.progress)}%`;
    });

    // Load atlases
    for (let i = 0; i <= ATLAS_AMOUNT; i++) {
        loader.add(`atlas-${i}.json`);
    }

    loader.load((loader, resources) => {
        const gifs = {};

        // Automatically create all sprites
        for (let i = 0; i <= ATLAS_AMOUNT; i++) {
            Object.entries(resources[`atlas-${i}.json`].textures).forEach(
                (texture) => {
                    if (
                        texture[0].endsWith(".gif") ||
                        texture[0].includes("ani")
                    ) {
                        const name = texture[0].substr(
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
                        sprites[
                            texture[0].substr(0, texture[0].lastIndexOf("."))
                        ] = new PIXI.Sprite(texture[1]);
                    }
                }
            );
        }

        // Create GIFs
        Object.entries(gifs).forEach((texture) => {
            sprites[texture[0]] = new PIXI.AnimatedSprite(texture[1]);
        });
    });

    // Timeline
    const FPS = 1000 / 24;
    let last = 0;
    let frame = 0;

    const update = (timestamp) => {
        if (timestamp - last >= FPS) {
            last = timestamp;
        }

        requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
})();
