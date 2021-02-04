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
        // Automatically create all sprites
        for (let i = 0; i <= ATLAS_AMOUNT; i++) {
            Object.entries(resources[`atlas-${i}.json`].textures).forEach(
                (texture) => {
                    sprites[texture[0]] = new PIXI.Sprite(texture[1]);
                }
            );
        }
    });

    // Update loop
    const update = () => {};
})();
