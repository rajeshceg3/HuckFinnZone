// --- Configuration & Data ---
export const CONFIG = {
    animationSpeed: 5000, // Time to play through full journey in ms (base speed)
    zoomLevel: 7
};

export const LOCATIONS = {
    'st-petersburg': {
        id: 'st-petersburg',
        lat: 38.6270, lng: -90.1994,
        title: "St. Petersburg",
        content: "The fictional starting point, representing Hannibal, Missouri. Here, Huck feels 'so lonesome I most wished I was dead,' trapped by the Widow Douglas and the constraints of 'sivilized' life.",
        quote: "The stars were shining, and the leaves rustled in the woods ever so mournful.",
        phase: "Extraction",
        risk: "Low",
        mile: 0,
        type: 'start'
    },
    'jacksons-island': {
        id: 'jacksons-island',
        lat: 38.4842, lng: -90.4143,
        title: "Jackson's Island",
        content: "Huck's first taste of true freedom. He fakes his own death and escapes to this island. Instead of solitude, he finds Jim, Miss Watson's runaway slave.",
        quote: "I was ever so glad to see Jim. I warn't lonesome now.",
        phase: "Evasion",
        risk: "Medium",
        mile: 15,
        type: 'waypoint'
    },
    'cairo': {
        id: 'cairo',
        lat: 37.0095, lng: -89.1353,
        title: "Cairo & The Fog",
        content: "A dense fog causes Huck and Jim to miss the Ohio River at Cairo, the turnoff to the free states. This fateful accident sends them deeper into the slave-holding South.",
        quote: "We could hear voices, but we couldn't see anything. We got separated.",
        phase: "Navigation",
        risk: "High",
        mile: 120,
        type: 'decision',
        choices: [
            {
                id: 'opt-south',
                label: "Miss the Turn (Historical)",
                targetId: 'grangerfords',
                description: "The fog is too thick. You drift past the mouth of the Ohio.",
                consequence: "You remain in slave territory. Risk increases."
            },
            {
                id: 'opt-north',
                label: "Steer for the Light",
                targetId: 'ohio-river',
                description: "You spot a faint glimmer through the fog and paddle hard against the current.",
                consequence: "You enter the Ohio River. The path to freedom opens."
            }
        ]
    },
    'grangerfords': {
        id: 'grangerfords',
        lat: 35.8395, lng: -90.0610,
        title: "The Grangerfords",
        content: "Huck is taken in by the aristocratic Grangerfords, who are locked in a deadly, senseless feud with the Shepherdsons.",
        quote: "There ain't no telling how cheating anybody is, or how honest, or how mean.",
        phase: "Conflict",
        risk: "Critical",
        mile: 250,
        type: 'waypoint'
    },
    'duke-king': {
        id: 'duke-king',
        lat: 34.4011, lng: -90.8740,
        title: "The Duke and the King",
        content: "Two con men take over the raft. They represent the worst of society, swindling townsfolk along the river. Huck is forced to be their accomplice.",
        quote: "It was enough to make a body ashamed of the human race.",
        phase: "Infiltration",
        risk: "High",
        mile: 350,
        type: 'waypoint'
    },
    'wilks': {
        id: 'wilks',
        lat: 33.1593, lng: -91.2404,
        title: "The Wilks Scandal",
        content: "The Duke and King's most audacious scam: impersonating the heirs to a local family's fortune. Huck's conscience finally wins, and he acts to expose them.",
        quote: "I says to myself, this is another one that I'm letting him rob her of her money.",
        phase: "Deception",
        risk: "High",
        mile: 480,
        type: 'waypoint'
    },
    'phelps': {
        id: 'phelps',
        lat: 32.7471, lng: -91.0715,
        title: "The Phelps Farm",
        content: "The journey's climax. The King sells Jim. Huck decides to defy religion and society to save his friend, finalizing his moral transformation.",
        quote: "'All right, then, I'll go to hell'—and tore it up.",
        phase: "Climax",
        risk: "Critical",
        mile: 600,
        type: 'end'
    },
    // --- Alternate History Nodes ---
    'ohio-river': {
        id: 'ohio-river',
        lat: 37.5, lng: -88.5, // Rough coord up the Ohio
        title: "The Ohio River",
        content: "Against all odds, you navigated the fog and entered the Ohio River. The current is slower, but the air smells different. Freedom is close.",
        quote: "Jim said it made him all over trembly and feverish to be so close to freedom.",
        phase: "Liberation",
        risk: "High", // Still dangerous (slave catchers)
        mile: 180,
        type: 'waypoint'
    },
    'freedom-port': {
        id: 'freedom-port',
        lat: 39.1031, lng: -84.5120, // Cincinnati
        title: "Cincinnati (Free Soil)",
        content: "You've reached a major port in a free state. Jim is effectively free, though the Fugitive Slave Act still looms. The journey has changed history.",
        quote: "We was free. And we didn't have to call no man master no more.",
        phase: "Victory",
        risk: "Low",
        mile: 350,
        type: 'end'
    }
};

export const SCENARIOS = {
    'historical': ['st-petersburg', 'jacksons-island', 'cairo', 'grangerfords', 'duke-king', 'wilks', 'phelps'],
    'freedom': ['st-petersburg', 'jacksons-island', 'cairo', 'ohio-river', 'freedom-port']
};
