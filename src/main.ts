import * as rm from "https://deno.land/x/remapper@4.2.0/src/mod.ts"
import * as bundleInfo from '../bundleinfo.json' with { type: 'json' }

const pipeline = await rm.createPipeline({ bundleInfo })

const bundle = rm.loadBundle(bundleInfo)
const materials = bundle.materials
const prefabs = bundle.prefabs

// ----------- { SCRIPT } -----------

async function doMap(file: rm.DIFFICULTY_NAME, chromaOnly: boolean = false) {
    const map = await rm.readDifficultyV3(pipeline, file);

    if(!chromaOnly) map.require("Vivify", true);
    map.suggest("Chroma", true);
    if(!chromaOnly) map.require("Noodle Extensions", true);

    /// ---- { FUNCTIONS } -----

    function setEnvironmentFade(beat: number, duration: number, from: number, to: number, precision: number) {
        precision *= duration; // make the precision not per 1 beat, but scale over the entire length of the event
        const diff = to - from;

        const material = materials.environmentfadematerial;
        
        for (let t = 0; t <= duration; t += precision) {
            const progress = t / duration;
            const value = from + diff * progress;
    
            material.set(map, { _Fill: value }, beat + t);
        }
        material.set(map, { _Fill: to }, beat + duration);
    }

    function setMaterialOpacity(material: rm.Material, beat: number, duration: number, from: number, to: number, precision: number) {
        precision *= duration; // make the precision not per 1 beat, but scale over the entire length of the event
        const diff = to - from;
        
        for (let t = 0; t <= duration; t += precision) {
            const progress = t / duration;
            const value = from + diff * progress;
            material.set(map, { _Opacity: value }, beat + t);
        }
        material.set(map, { _Opacity: to }, beat + duration);
    }

    /// ---- { ENVIRONMENT } -----

    // Assign all notes to a track
    if(!chromaOnly) map.allNotes.forEach(note => {
        note.track.add("allNotes")
    })

    // Apply custom note prefab to all notes
    if(!chromaOnly) rm.assignObjectPrefab(map, {
        colorNotes: {
            track: "allNotes",
            asset: prefabs.customnote.path,
            debrisAsset: prefabs.customnotedebris.path,
            anyDirectionAsset: prefabs.customnotedot.path
        },
        chainHeads: {
            track: "allNotes",
            asset: prefabs.customchain.path,
            debrisAsset: prefabs.customchaindebris.path
        },
        chainLinks: {
            track: "allNotes",
            asset: prefabs.customchainlink.path,
            debrisAsset: prefabs.customchainlinkdebris.path
        }
    })

    // Static Environment Prefabs/Materials
    prefabs.skybox.instantiate(map, 0);
    prefabs.transitionrunwayleft.instantiate(map, 0);
    prefabs.transitionrunwayright.instantiate(map, 0);
    prefabs.environmentfade.instantiate(map, 0);
    materials.environmentfadematerial.set(map, {_Fill: 1.5});
    prefabs.testcube.instantiate(map, 0);

    const airplaneCabin = prefabs["airplane cabin"].instantiate(map, 0);
    const airplaneRunway = prefabs["airplane runway"].instantiate(map, 0);
    const airplaneSeats = prefabs.seats.instantiate(map, 0);
    const clouds = prefabs.clouds.instantiate(map, 0);

    // Environment Removals
    if(!chromaOnly) rm.environmentRemoval(map, [
        "Rain",
        "Water",
        "LeftRail",
        "RightRail",
        "LeftFarRail",
        "RightFarRail",
        "RailingFull",
        "Curve",
        "LightRailingSegment",
        "PlayersPlace",
        "Clouds",
        "Smoke",
        "Mountains"
    ], "Contains")

    /// ---- { EVENTS } -----

    setEnvironmentFade(2, 2, 1.5, 0, 1/64);
    
    // Remove airplane environment & transition to street environment
    const cloudParticles = prefabs.cloudparticles.instantiate(map, 88);
    setMaterialOpacity(materials.cloudparticles, 88, 1.5, 0, 1, 1/16);
    setEnvironmentFade(85.5, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 88.5, 1.5, 0, 1, 1/16);
    airplaneCabin.destroyObject(91);
    airplaneRunway.destroyObject(91);
    airplaneSeats.destroyObject(91);
    setMaterialOpacity(materials.cloudparticles, 101, 2, 1, 0, 1/16);
    cloudParticles.destroyObject(104);
    setMaterialOpacity(materials.transitionrunwaymaterial, 100, 2, 1, 0, 1/16);
    setEnvironmentFade(101, 2, 1.5, 0, 1/64);
}

await Promise.all([
    doMap('ExpertPlusStandard'),
])

// ----------- { OUTPUT } -----------

pipeline.export({
    outputDirectory: '../OutputMaps/TPTNL - AJR'
})

console.log("Done!")