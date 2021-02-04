const loader = PIXI.Loader.shared;
const preloader = new PIXI.Loader();
const sprites = {};

loader.baseUrl = "./assets/atlases/";
preloader.baseUrl = "./assets/images";

///--- Preloader ---///
preloader.onError.add((e) => {
    console.error(e);
});

preloader.add("preloader", "border.png");

preloader.load((loader, resources) => {
    sprites.preloader = new PIXI.Sprite(resources.preloader.texture);
    app.stage.addChild(sprites.preloader);
});

///--- Main loader ---///
loader.onError.add((e) => {
    console.error(e);
});

// Load atlases
for (let i = 0; i <= 38; i++) {
    loader.add(`atlas-${i}.json`);
}

loader.load((loader, resources) => {
    const atlas_0 = resources["atlas-0.json"].textures;

    const bg3_0 = new PIXI.Sprite(atlas_0["bg3-0.png"]);
    app.stage.addChild(bg3_0);
});
