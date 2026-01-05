/**
 * Project PROMETHEUS: Predictive Hazard Modeling Engine
 *
 * Performs Monte Carlo simulations to estimate mission success probabilities
 * based on environmental factors, threat levels, and operational parameters.
 */

export default class PredictiveEngine {
    constructor() {
        this.iterations = 500; // Number of simulation runs
    }

    /**
     * Run a simulation for a specific decision choice.
     * @param {Object} startPoint - The current location node.
     * @param {Object} choice - The decision option selected.
     * @param {Object} params - Operational parameters (speed, stealth).
     * @returns {Object} Simulation results (successRate, logs).
     */
    runSimulation(startPoint, choice, params = { speed: 50, stealth: 50 }) {
        let successCount = 0;
        const logs = [];

        // Base risk factor from the node (0-100)
        let baseRisk = this.getRiskValue(startPoint.risk);

        // Adjust risk based on choice consequence (heuristic)
        if (choice.consequence.includes("Risk increases")) baseRisk += 20;
        if (choice.consequence.includes("Safe")) baseRisk -= 20;

        // Run iterations
        for (let i = 0; i < this.iterations; i++) {
            if (this.simulateRun(baseRisk, params)) {
                successCount++;
            }
        }

        const successRate = (successCount / this.iterations) * 100;

        // Generate pseudo-logs for the UI
        logs.push(`VECTOR ANALYSIS: ${choice.targetId.toUpperCase()}`);
        logs.push(`BASE RISK FACTOR: ${baseRisk}`);
        logs.push(`PARAM MODIFIERS: SPEED=${params.speed} STEALTH=${params.stealth}`);
        logs.push(`SIMULATION COMPLETE. SUCCESS PROBABILITY: ${successRate.toFixed(1)}%`);

        return {
            successRate,
            logs
        };
    }

    /**
     * Simulates a single run.
     * @returns {boolean} True if mission succeeds, False if failed.
     */
    simulateRun(baseRisk, params) {
        // Factors:
        // Speed: Higher speed = Lower exposure time (Good) but Higher visibility (Bad)
        // Stealth: Higher stealth = Lower visibility (Good) but Slower speed (Bad)

        // Let's model it:
        // Detection Chance = (BaseRisk + Speed - Stealth) + Random Noise

        const randomFactor = (Math.random() * 40) - 20; // +/- 20 variance

        // Speed increases detection risk (linear)
        const speedPenalty = (params.speed / 100) * 30;

        // Stealth reduces detection risk
        const stealthBonus = (params.stealth / 100) * 40;

        const effectiveRisk = baseRisk + speedPenalty - stealthBonus + randomFactor;

        // Threshold for failure (getting caught)
        // If effective risk > 80, we fail.
        return effectiveRisk < 80;
    }

    getRiskValue(riskString) {
        switch (riskString) {
            case 'Low': return 20;
            case 'Medium': return 40;
            case 'High': return 60;
            case 'Critical': return 80;
            default: return 30;
        }
    }

    /**
     * Generates hazard zones for visualization based on the decision context.
     * @param {Object} point - The current location.
     * @returns {Array} Array of hazard objects (lat, lng, radius, intensity).
     */
    generateHazards(point) {
        const hazards = [];
        // Create random hazards around the point to simulate "Fog" or "Patrols"
        const count = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            // Random offset
            const latOffset = (Math.random() - 0.5) * 0.5;
            const lngOffset = (Math.random() - 0.5) * 0.5;

            hazards.push({
                lat: point.lat + latOffset,
                lng: point.lng + lngOffset,
                radius: 5000 + Math.random() * 10000, // meters
                intensity: Math.random() // 0-1 opacity
            });
        }
        return hazards;
    }
}
