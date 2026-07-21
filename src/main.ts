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
        
        if(duration > 0) {
            for (let t = 0; t <= duration; t += precision) {
                const progress = t / duration;
                const value = from + diff * progress;
                material.set(map, { _Opacity: value }, beat + t);
            }
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
                            [60, -100, -90, 91/d],         // City Street
                            [60, -100, -90, 285/d],        // ^
                            [60, -100, -90, 286/d],        // House
                            [60, -100, -90, 409/d],        // ^
                            [120, -100, -90, 410/d],       // Sky
                        ],
                        position: [
                            [-3, 3.75 + airplaneHeightOffset * (i + 1), 50, 0],          // Airplane Cabin
                            [-3, 3.75 + airplaneHeightOffset * (i + 1), 50, 90/d],       // ^
                            [-3.6, -2.1, cityDepthOffset * (i + 1), 91/d],               // City Street
                            [-3.6, -2.1, cityDepthOffset * (i + 1), 285/d],              // ^
                            [-20 + 1.76 * (i + 1), -2.1, 10 + 2 * (i + 1), 286/d],       // House
                            [-20 + 1.76 * (i + 1), -2.1, 10 + 2 * (i + 1), 409/d],       // House
                            [-3, -4, cityDepthOffset * (i + 1), 410/d]                 // Sky
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
                            [60, 100, 90, 91/d],       // City Street
                            [60, 100, 90, 285/d],      // ^
                            [60, 100, 90, 285/d],      // House
                            [60, 100, 90, 409/d],      // ^
                            [60, -100, -90, 410/d],    // Sky
                        ],
                        position: [
                            [3, 3.75 + airplaneHeightOffset * (i + 1), 50, 0],          // Airplane Cabin
                            [3, 3.75 + airplaneHeightOffset * (i + 1), 50, 90/d],       // ^
                            [3.6, -2.1, cityDepthOffset * (i + 1), 91/d],               // City Street
                            [3.6, -2.1, cityDepthOffset * (i + 1), 285/d],              // ^
                            [20 - 1.76 * (i + 1), -2.1, 10 + 2 * (i + 1), 286/d],       // House
                            [20 - 1.76 * (i + 1), -2.1, 10 + 2 * (i + 1), 409/d],       // House
                            [2.9, -4, cityDepthOffset * (i + 1), 410/d]                   // Sky
                        ]
                    }
                });
            }
        }
    }

    /**
     * Show/hide Beat Saber's UI panels of the score, combo, song timer, etc.
     * @param beat When this event should start.
     * @param value Whether they should be toggled on or off.
     */
    function toggleUiPanels(beat: number, value: "on" | "off") {
        rm.animateTrack(map,{
            track: "uiPanelLeft",
            beat: beat,
            animation: {
                localPosition: value == "on" ? [-2.75, 1, 7.5] : [0,-1000, 0]
            }
        })
        rm.animateTrack(map,{
            track: "uiPanelRight",
            beat: beat,
            animation: {
                localPosition: value == "on" ? [2.75, 0.5, 7.5] : [0,-1000, 0]
            }
        })
    }

    const lightingMaterialsList = [
        materials.grassplanematerial,
        materials.grassmaterial3,
        materials.treematerial1,
        materials.treematerial2,
        materials.treematerial3,
        materials.rockmaterial1,
        materials.rockmaterial2,
        materials.rockmaterial3,
        materials.rockmaterial4,
        materials.treetrunkmaterial,
        materials.bushbigmaterial,
        materials.bushflowermaterial,
        materials.bushmed2material,
        materials.bushmedmaterial,
        materials.runwaymaterialhouse,
        materials["housematerial awning"],
        materials["housematerial floor"],
        materials["housematerial main"],
        materials["housematerial roofline"],
        materials["housematerial windows"],
        materials.skyboxendmaterial
    ]
    /**
     * Linearly changes the day/night cycle of the environment.
     * @param beat The beat on which this event should start.
     * @param duration How many beats this event should take.
     * @param from The value of the day/night cycle at the beginning of the event.
     * @param to The value of the day/night cycle at the end of the event.
     * @param precision How smooth the event should look / how many custom events this should take.
     */
    function setDayNightCycle(beat: number, duration: number, from: number, to: number, precision: number, mat?: rm.Material) {
        precision *= duration; // make the precision not per 1 beat, but scale over the entire length of the event
        const diff = to - from;
        
        const cycleObj = { _DayNightCycle: 0}
        if(duration != 0) {
            for (let t = 0; t <= duration; t += precision) {
                const progress = t / duration;
                const value = from + diff * progress;

                cycleObj._DayNightCycle = value;
                
                if(mat == null) {
                    lightingMaterialsList.forEach(material => {
                        material.set(map, cycleObj, beat + t);
                    })
                }
                else {
                    mat.set(map, cycleObj, beat + t);
                }
            }
        }
        if(mat == null) {
            lightingMaterialsList.forEach(material => {
                material.set(map, { _DayNightCycle: to }, beat + duration);
            });
        }
        else {
            mat.set(map, { _DayNightCycle: to }, beat + duration);
        }
    }

    /// ---- { ENVIRONMENT } -----

    // Lasers
    setLaserTracks("left");
    setLaserTracks("right");
    setLaserPositions("left");
    setLaserPositions("right");

    // Left UI Panel
    if(!chromaOnly) rm.environment(map, {
        id: "LeftPanel",
        lookupMethod: "EndsWith",
        localPosition: [-2.75, 1, 7.5],
        rotation: [0, -20, 0],
        track: "uiPanelLeft"
    })

    // Right UI Panel
    if(!chromaOnly) rm.environment(map, {
        id: "RightPanel",
        lookupMethod: "EndsWith",
        localPosition: [2.75, 0.5, 5.5],
        rotation: [0, 20, 0],
        track: "uiPanelRight"
    })

    // Moon
    rm.environment(map, {
        id: `Moon`,
        lookupMethod: "EndsWith",
        "localPosition": [
            0,
            22,
            150
        ],
        "scale": [
            10,
            10,
            10
        ]
    });

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
    const skybox = prefabs.skybox.instantiate(map, 0);
    prefabs.transitionrunwayleft.instantiate(map, 0);
    prefabs.transitionrunwayright.instantiate(map, 0);
    prefabs.environmentfade.instantiate(map, 0);
    materials.environmentfadematerial.set(map, {_Fill: 1.5});
    // prefabs.testcube.instantiate(map, 0); this random cube stayed in the map without me noticing for over 7 months lmao

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

    prefabs.animatedlyrics.instantiate(map, 0);
    prefabs.houselyrics.instantiate(map, 0);

    // Load airplane environment
    toggleUiPanels(0, "off");
    const airplaneCabin = prefabs["airplane cabin"].instantiate(map, 0);
    const airplaneRunway = prefabs["airplane runway"].instantiate(map, 0);
    const airplaneSeats = prefabs.seats.instantiate(map, 0);
    const planeClouds = prefabs.clouds.instantiate(map, 0);
    const cloudParticles = prefabs.cloudparticles.instantiate(map, 0);
    setMaterialOpacity(materials.cloudparticles, 0, 0, 0, 0, 1/16);
    setEnvironmentFade(2, 4, 1.5, 0, 1/64);
    
    // Remove airplane scene & start transition
    setMaterialOpacity(materials.cloudparticles, 88, 1.5, 0, 1, 1/16);
    setEnvironmentFade(85.5, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 88.5, 1.5, 0, 1, 1/16);
    airplaneCabin.destroyObject(90);
    airplaneRunway.destroyObject(90);
    airplaneSeats.destroyObject(90);
    planeClouds.destroyObject(90);
    
    // Exit transition & load city street scene
    setMaterialOpacity(materials.cloudparticles, 101, 2, 1, 0, 1/16);
    setMaterialOpacity(materials.transitionrunwaymaterial, 100, 2, 1, 0, 1/16);
    setEnvironmentFade(101, 2, 1.5, 0.7, 1/64);

    const sidewalks = prefabs.sidewalks.instantiate(map, 100);
    const cityBuildings = prefabs["city buildings"].instantiate(map, 100);
    const treeFences = prefabs["tree fences"].instantiate(map, 100);
    const road = prefabs.road.instantiate(map, 100);
    const houses = prefabs.houses.instantiate(map, 100);
    const cars = prefabs.cars.instantiate(map, 102);
    const cityClouds = prefabs.cityclouds.instantiate(map, 100);
    const leafParticles = prefabs.leafparticles.instantiate(map, 168);
    const leafPiles = prefabs.leafpiles.instantiate(map, 100);

    // Remove city street scene & start transition
    setMaterialOpacity(materials.cloudparticles, 200, 1.5, 0, 1, 1/16);
    setEnvironmentFade(197.5, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 200.5, 1.5, 0, 1, 1/16);
    sidewalks.destroyObject(202);
    cityBuildings.destroyObject(202);
    treeFences.destroyObject(202);
    road.destroyObject(202);
    houses.destroyObject(202);
    cars.destroyObject(202);
    cityClouds.destroyObject(202);
    leafParticles.destroyObject(202);
    leafPiles.destroyObject(202);

    // Exit transition & load elevator scene
    setMaterialOpacity(materials.cloudparticles, 213, 2, 1, 0, 1/16);
    setMaterialOpacity(materials.transitionrunwaymaterial, 212, 2, 1, 0, 1/16);
    setEnvironmentFade(213, 2, 1.5, 0.7, 1/64);
    const elevator = prefabs.elevator.instantiate(map, 212)
    const elevatorVignette = prefabs.elevatorvignette.instantiate(map, 212)
    const elevatorDisplay = prefabs.animatedelevatordisplay.instantiate(map, 212)
    const elevatorShafts = prefabs.elevatorshafts.instantiate(map, 212);
    
    /// Elevator Ceiling Lights
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling1",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 19
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling1",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [-0.8773, 2.8794, 4.0288, 0],
                [-0.8773, 2.8794, 4.0288, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling2",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 20
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling2",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0, 2.8794, 4.0288, 0],
                [0, 2.8794, 4.0288, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling3",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 21
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling3",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0.8773, 2.8794, 4.0288, 0],
                [0.8773, 2.8794, 4.0288, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling4",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 22
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling4",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [-0.8773, 2.8794, 2.489, 0],
                [-0.8773, 2.8794, 2.489, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling5",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 23
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling5",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0, 2.8794, 2.489, 0],
                [0, 2.8794, 2.489, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling6",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 24
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling6",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0.8773, 2.8794, 2.489, 0],
                [0.8773, 2.8794, 2.489, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling7",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 25
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling7",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [-0.8773, 2.8794, 0.943, 0],
                [-0.8773, 2.8794, 0.943, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling8",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 26
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling8",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0, 2.8794, 0.943, 0],
                [0, 2.8794, 0.943, 1],
                [0, -10000, 0, 1]
            ]
        }
    })
    rm.geometry(map, {
        type: "Cube",
        track: "elevatorCeiling9",
        position: [0, -10000, 0],
        scale: [0.8612955, 0.05070519, 1.508838],
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 2,
                lightID: 27
            }
        },
    })
    rm.animateTrack(map, {
        track: "elevatorCeiling9",
        beat: 214,
        duration: 68,
        animation: {
            position: [
                [0.8773, 2.8794, 0.943, 0],
                [0.8773, 2.8794, 0.943, 1],
                [0, -10000, 0, 1]
            ]
        }
    })

    // Remove elevator and fade to black
    elevator.destroyObject(288)
    elevatorDisplay.destroyObject(288);
    elevatorVignette.destroyObject(288);
    elevatorShafts.destroyObject(288);
    setEnvironmentFade(280, 4, 0, 1.5, 1/64);
    setMaterialOpacity(materials.cloudparticles, 283, 4, 0, 1, 1/16);
    setMaterialOpacity(materials.transitionrunwaymaterial, 283, 4, 0, 1, 1/16);

    /// House environment
    setMaterialOpacity(materials.cloudparticles, 294, 3, 1, 0, 1/16);
    setEnvironmentFade(294, 4, 1.5, 0, 1/64);
    setMaterialOpacity(materials.transitionrunwaymaterial, 293, 3, 1, 0, 1/16);
    const house = prefabs.house.instantiate(map, 291);
    const bushes = prefabs.bushes.instantiate(map, 291);
    const trees = prefabs.trees.instantiate(map, 291);
    const rocks = prefabs.rocks.instantiate(map, 291);
    const grass = prefabs.grass.instantiate(map, 291);
    const grassPlane = prefabs.grassplane.instantiate(map, 291);
    const runway = prefabs.runway.instantiate(map, 291);
    const lamps = prefabs.lamps.instantiate(map, 291);
    const sleepingParticles = prefabs.sleepingparticles.instantiate(map, 291);

    // Bottom window light
    if(!chromaOnly) rm.geometry(map, {
        type: "Cube",
        track: "bottomWindowLight",
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 0,
                lightID: 13
            }
        },
        position: [0, -10000, 0],
        rotation: [-90, 0, -147.951],
        scale: [0.1629212, 1.64822, 1.486101]
    })
    rm.animateTrack(map, {
        track: "bottomWindowLight",
        beat: 291,
        duration: 115,
        animation: {
            position: [
                [-8.465, 2, 12.92, 0],
                [-8.465, 2, 12.92, 1],
                [0, -10000, 0, 1]
            ]
        }
    })

    // Door light
    if(!chromaOnly) rm.geometry(map, {
        type: "Cube",
        track: "doorLight",
        material: {
            shader: "OpaqueLight"
        },
        components: {
            ILightWithId: {
                type: 0,
                lightID: 14
            }
        },
        position: [0, -10000, 0],
        rotation: [-90, 0, -147.951],
        scale: [0.1629212, 1.64822, 1.486101]
    })
    rm.animateTrack(map, {
        track: "doorLight",
        beat: 291,
        duration: 115,
        animation: {
            position: [
                [-7.1572, 2.0895, 15.1953, 0],
                [-7.1572, 2.0895, 15.1953, 1],
                [0, -10000, 0, 1]
            ]
        }
    })

    // Left lantern light 1
    if(!chromaOnly) rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 1,
                lightID: 5
            }
        },
        localPosition: [-3.810996, 4.032, 6.5],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    // Left lantern light 2
    if(!chromaOnly) rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 6,
                lightID: 5
            }
        },
        localPosition: [-3.810996, 4.032, 13.25],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    // Left lantern light 3
    if(!chromaOnly)  rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 7,
                lightID: 5
            }
        },
        localPosition: [-3.810996, 4.032, 20],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    // Right lantern light 1
    if(!chromaOnly) rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 1,
                lightID: 6
            }
        },
        localPosition: [3.810996, 4.032, 6.5],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    // Right lantern light 2
    if(!chromaOnly) rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 6,
                lightID: 6
            }
        },
        localPosition: [3.810996, 4.032, 13.25],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    // Right lantern light 3
    if(!chromaOnly)  rm.geometry(map, {
        type: "Cylinder",
        material: {
            shader: "TransparentLight"
        },
        components: {
            ILightWithId: {
                type: 7,
                lightID: 6
            }
        },
        localPosition: [3.810996, 4.032, 20],
        rotation: [0, 0, 0],
        scale: [0.3797671, 0.2093542, 0.3797671]
    })

    setDayNightCycle(291, 0.5, 0.5, 0.5, 1/4);
    materials.skyboxmaterial.set(map, {
        _DayNightCycle: 0,
    }, 291);

    // Cameras
    const screenshotters = prefabs.screenshotters.instantiate(map, 0);
    screenshotters.destroyObject(396);
    
    const flashbackAirplaneCabin = prefabs.flashbackairplanecabin.instantiate(map, 330.5);
    const flashbackStreet = prefabs.flashbackstreet.instantiate(map, 338.5)
    const flashbackElevator = prefabs.flashbackelevator.instantiate(map, 347);
    const extraSleepingParticles = prefabs.sleepingparticlesextra.instantiate(map, 354.5);

    setDayNightCycle(385, 4, 0.5, 0, 1/16);

    // Fade house to black
    setEnvironmentFade(385, 9, 0, 1.5, 1/64);

    // Remove house & fade out to sky
    house.destroyObject(402);
    bushes.destroyObject(402);
    trees.destroyObject(402);
    rocks.destroyObject(402);
    grass.destroyObject(402);
    grassPlane.destroyObject(402);
    sleepingParticles.destroyObject(394);
    flashbackAirplaneCabin.destroyObject(402);
    flashbackStreet.destroyObject(402);
    flashbackElevator.destroyObject(402);
    extraSleepingParticles.destroyObject(394);
    runway.destroyObject(402);
    lamps.destroyObject(402);
    materials.skyboxmaterial.set(map, {
        _DayNightCycle: 1,
    }, 402);
    setEnvironmentFade(411, 2, 1.5, 0, 1/64);
    toggleUiPanels(411.5, "on");
    prefabs.cloudssky.instantiate(map, 410);
    prefabs.airplane.instantiate(map, 410);
    skybox.destroyObject(410);
    prefabs.skyboxend.instantiate(map, 410);
    materials.skyboxendmaterial.set(map, {
        _DayNightCycle: 1,
    }, 410);


    setDayNightCycle(446, 498-446, 1, 0, 1/256, materials.skyboxendmaterial);
    rm.environment(map, {
        id: "Sun",
        lookupMethod: "EndsWith",
        track: "sunEnding",
    })
    rm.animateTrack(map, {
        track: "sunEnding",
        beat: 446,
        duration: 498-446,
        animation: {
            localPosition: [
                [0, 15.8, 110, 0],
                [0, -5, 110, 1]
            ]
        }
    })
}

await Promise.all([
    doMap('ExpertPlusStandard'),
])

// ----------- { OUTPUT } -----------

pipeline.export({
    outputDirectory: '../OutputMaps/TPTNL - AJR'
})

console.log("Done!")