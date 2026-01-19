import * as rm from "https://deno.land/x/remapper@4.2.0/src/mod.ts"
import * as bundleInfo from '../bundleinfo.json' with { type: 'json' }
import { setAnimatorProperty } from "https://deno.land/x/remapper@4.2.0/src/builder_functions/beatmap/object/custom_event/vivify.ts";

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

    function setLaserTracks(side: "left" | "right") {
        if(side == "left") {
            rm.environment(map, {
                id: "s.[0]PillarL",
                lookupMethod: "EndsWith",
                "track": "laser_L0"
            })
            for(let i = 1; i < 9;i++) {
                rm.environment(map, {
                    id: `s (${i}).[0]PillarL`,
                    lookupMethod: "EndsWith",
                    "track": `laser_L${i}`
                })
            }
        }
        else {
            rm.environment(map, {
                id: "s.[1]PillarR",
                lookupMethod: "EndsWith",
                "track": "laser_R0"
            })
            for(let i = 1; i < 9; i++) {
                rm.environment(map, {
                    id: `s (${i}).[1]PillarR`,
                    lookupMethod: "EndsWith",
                    "track": `laser_R${i}`
                })
            }
        }
    }

    function setLaserPositions(side: "left" | "right") {
        const airplaneHeightOffset = -0.3;
        const cityDepthOffset = 5;
        const d = 500;
        if(side == "left") {
            for(let i = 0; i < 9; i++) {
                rm.animateTrack(map, {
                    track: `laser_L${i}`,
                    beat: 0,
                    duration: d,
                    animation: {
                        scale: [
                            [1, 0.5, 0.5, 0],
                            [1, 0.5, 0.5, 90/d],
                            [1, 1, 1, 91/d],
                        ],
                        rotation: [
                            [0, -60.5, 15, 0],             // Airplane Cabin
                            [0, -60.5, 15, 90/d],          // ^
                            [60, -100, -90, 91/d],
                        ],
                        position: [
                            [-3, 3.75 + airplaneHeightOffset * (i + 1), 50, 0],          // Airplane Cabin
                            [-3, 3.75 + airplaneHeightOffset * (i + 1), 50, 90/d],       // ^
                            [-3.6, -2.1, cityDepthOffset * (i + 1), 91/d],
                        ]
                    }
                });
            }
        }
        else {
            for(let i = 0; i < 9; i++) {
                rm.animateTrack(map, {
                    track: `laser_R${i}`,
                    beat: 0,
                    duration: d,
                    animation: {
                        scale: [
                            [1, 0.5, 0.5, 0],
                            [1, 0.5, 0.5, 90/d],
                            [1, 1, 1, 91/d],
                        ],
                        rotation: [
                            [0, 60.5, -15, 0],         // Airplane Cabin
                            [0, 60.5, -15, 90/d],      // ^
                            [60, 100, 90, 91/d],
                        ],
                        position: [
                            [3, 3.75 + airplaneHeightOffset * (i + 1), 50, 0],          // Airplane Cabin
                            [3, 3.75 + airplaneHeightOffset * (i + 1), 50, 90/d],       // ^
                            [3.6, -2.1, cityDepthOffset * (i + 1), 91/d],
                        ]
                    }
                });
            }
        }
    }

    /// ---- { ENVIRONMENT } -----

    // Lasers
    setLaserTracks("left");
    setLaserTracks("right");
    setLaserPositions("left");
    setLaserPositions("right");

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

    // Note shadows 
    if(!chromaOnly) {
        const shadowPositions = new Set();
        map.allNotes.forEach(note => {
            // Create a unique key for this shadow position
            const key = `${note.beat}-${note.x}`;

            // If a shadow for this column & beat was already spawned → skip
            if (shadowPositions.has(key)) return;
            shadowPositions.add(key);
            let trackName = "noteShadowsFull";
            if(note.y == 1) trackName = "noteShadowsHalf"
            else if(note.y == 2) trackName = "noteShadowsFaint"
            rm.colorNote(map, {
                beat: note.beat,
                x: note.x,
                y: 0,
                track: trackName,
                fake: true,
                disableNoteLook: true,
                disableNoteGravity: true,
                spawnEffect: false,
                uninteractable: true,
            })
        });
        rm.assignObjectPrefab(map, {
            colorNotes: {
                track: "noteShadowsFull",
                asset: prefabs["custom note shadow full"].path,
            },
            chainHeads: {
                track: "noteShadowsFull",
                asset: prefabs["custom note shadow full"].path,
            },
            chainLinks: {
                track: "noteShadowsFull",
                asset: prefabs["custom note shadow full"].path,
            },
        })
        rm.assignObjectPrefab(map, {
            colorNotes: {
                track: "noteShadowsHalf",
                asset: prefabs["custom note shadow half"].path,
            },
            chainHeads: {
                track: "noteShadowsHalf",
                asset: prefabs["custom note shadow half"].path,
            },
            chainLinks: {
                track: "noteShadowsHalf",
                asset: prefabs["custom note shadow half"].path,
            },
        })
        rm.assignObjectPrefab(map, {
            colorNotes: {
                track: "noteShadowsFaint",
                asset: prefabs["custom note shadow faint"].path,
            },
            chainHeads: {
                track: "noteShadowsFaint",
                asset: prefabs["custom note shadow faint"].path,
            },
            chainLinks: {
                track: "noteShadowsFaint",
                asset: prefabs["custom note shadow faint"].path,
            },
        })
    }

    // Airplane Scene lights
    // Top left lights
    if(!chromaOnly) for(let i = 0; i < 7; i++) {
        let type;
        let id = 5;
        if(i == 0) type = 1
        if(i == 1) type = 6
        if(i == 2) type = 7
        if(i == 3) type = 0
        if(i == 4) {
            type = 0;
            id = 7;
        }
        if(i == 5) {
            type = 0;
            id = 9;
        }
        if(i == 6) {
            type = 0;
            id = 11;
        }
        rm.geometry(map, {
            type: "Cylinder",
            material: {
                shader: "TransparentLight"
            },
            components: {
                ILightWithId: {
                    type: type,
                    lightID: id
                }
            },
            position: [-1.82, 3.481, 4.9354 + 4.9646 * i],
            rotation: [90, 0, 0],
            scale: [0.12843, 1.223006, 0.12843]
        });
    }
    // Top right lights
    if(!chromaOnly) for(let i = 0; i < 7; i++) {
        let type;
        let id = 6;
        if(i == 0) type = 1
        if(i == 1) type = 6
        if(i == 2) type = 7
        if(i == 3) type = 0
        if(i == 4) {
            type = 0;
            id = 8;
        }
        if(i == 5) {
            type = 0;
            id = 10;
        }
        if(i == 6) {
            type = 0;
            id = 12;
        }
        rm.geometry(map, {
            type: "Cylinder",
            material: {
                shader: "TransparentLight"
            },
            components: {
                ILightWithId: {
                    type: type,
                    lightID: id
                }
            },
            position: [1.82, 3.481, 4.9354 + 4.9646 * i],
            rotation: [90, 0, 0],
            scale: [0.12843, 1.223006, 0.12843]
        });
    }

    // Static Environment Prefabs/Materials
    prefabs.skybox.instantiate(map, 0);
    prefabs.transitionrunwayleft.instantiate(map, 0);
    prefabs.transitionrunwayright.instantiate(map, 0);
    prefabs.environmentfade.instantiate(map, 0);
    materials.environmentfadematerial.set(map, {_Fill: 1.5});
    prefabs.testcube.instantiate(map, 0);

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
        "Smoke",
        "Clouds",
        "Mountains"
    ], "Contains")

    /// ---- { EVENTS } -----

    // Load airplane environment
    const airplaneCabin = prefabs["airplane cabin"].instantiate(map, 0);
    const airplaneRunway = prefabs["airplane runway"].instantiate(map, 0);
    const airplaneSeats = prefabs.seats.instantiate(map, 0);
    const clouds = prefabs.clouds.instantiate(map, 0);
    setEnvironmentFade(2, 4, 1.5, 0, 1/64);
    
    // Remove airplane scene & start transition
    const cloudParticles = prefabs.cloudparticles.instantiate(map, 88);
    setMaterialOpacity(materials.cloudparticles, 88, 1.5, 0, 1, 1/16);
    setEnvironmentFade(85.5, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 88.5, 1.5, 0, 1, 1/16);
    airplaneCabin.destroyObject(90);
    airplaneRunway.destroyObject(90);
    airplaneSeats.destroyObject(90);
    

    // Exit transition & load city street scene
    setMaterialOpacity(materials.cloudparticles, 101, 2, 1, 0, 1/16);
    setMaterialOpacity(materials.transitionrunwaymaterial, 100, 2, 1, 0, 1/16);
    setEnvironmentFade(101, 2, 1.5, 0.7, 1/64);

    const sidewalk = prefabs.sidewalk.instantiate(map, 100);
    const sidewalkAcrossRoad = prefabs["sidewalk across road"].instantiate(map, 100);
    const sidewalk2 = prefabs.sidewalk2.instantiate(map, 100);
    const treeFences = prefabs["tree fences"].instantiate(map, 100);
    const road = prefabs.road.instantiate(map, 100);
    const houses = prefabs.houses.instantiate(map, 100);
    const cityClouds = prefabs.cityclouds.instantiate(map, 100);

    // Remove city street scene & start transition
    setMaterialOpacity(materials.cloudparticles, 200, 1.5, 0, 1, 1/16);
    setEnvironmentFade(197.5, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 200.5, 1.5, 0, 1, 1/16);
    sidewalk.destroyObject(200);
    sidewalkAcrossRoad.destroyObject(200);
    sidewalk2.destroyObject(200);
    treeFences.destroyObject(200);
    road.destroyObject(200);
    houses.destroyObject(200);
    cityClouds.destroyObject(200);

    // Exit transition & load elevator scene
    setMaterialOpacity(materials.cloudparticles, 213, 2, 1, 0, 1/16);
    setMaterialOpacity(materials.transitionrunwaymaterial, 212, 2, 1, 0, 1/16);
    setEnvironmentFade(213, 2, 1.5, 0.7, 1/64);
}

await Promise.all([
    doMap('ExpertPlusStandard'),
])

// ----------- { OUTPUT } -----------

pipeline.export({
    outputDirectory: '../OutputMaps/TPTNL - AJR'
})

console.log("Done!")