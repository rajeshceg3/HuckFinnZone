/**
 * Tactical Analytics Module
 * Calculates threat levels, pursuit vectors, and safety indices.
 */
export default class TacticalAnalytics {
    constructor(config) {
        this.config = config || {};
        this.pursuitProgress = 0; // 0.0 to 1.0 (relative to path)
        this.pursuitSpeed = 0.03; // Base speed relative to Huck (simulated lag)
        this.currentThreatLevel = 'Low';
        this.safetyIndex = 100;
    }

    reset() {
        this.pursuitProgress = 0;
        this.currentThreatLevel = 'Low';
        this.safetyIndex = 100;
    }

    /**
     * Updates the state of the pursuit vector based on Huck's progress.
     * The pursuer tries to catch up but has a max speed.
     * @param {number} huckProgress - Current mission progress (0-1)
     * @param {object} currentNode - The current node/location object
     */
    update(huckProgress, currentNode) {
        // Pursuit Logic:
        // The pursuer is always behind, but the gap varies based on "Risk".
        // If Risk is High, the pursuer moves faster (gap closes).

        let targetGap = 0.05; // Standard 5% lag

        if (currentNode) {
            this.currentThreatLevel = currentNode.risk || 'Low';

            switch (currentNode.risk) {
                case 'Low': targetGap = 0.10; break;
                case 'Medium': targetGap = 0.08; break;
                case 'High': targetGap = 0.04; break;
                case 'Critical': targetGap = 0.02; break;
            }
        }

        const targetPursuitProgress = Math.max(0, huckProgress - targetGap);

        // Smoothly interpolate pursuit progress towards target
        // This simulates the "rubber band" effect of a chase
        const delta = targetPursuitProgress - this.pursuitProgress;
        this.pursuitProgress += delta * 0.1; // Ease in

        // Calculate Safety Index (Inverse of Threat + Proximity)
        // 100% = Safe, 0% = Caught
        const proximity = (huckProgress - this.pursuitProgress) * 100; // e.g. 5.0

        // Base safety on risk
        let baseSafety = 100;
        if (this.currentThreatLevel === 'Medium') baseSafety = 80;
        if (this.currentThreatLevel === 'High') baseSafety = 50;
        if (this.currentThreatLevel === 'Critical') baseSafety = 20;

        // Adjust by proximity (closer = less safe)
        // If proximity is > 10, no penalty. If < 2, massive penalty.
        let proximityPenalty = 0;
        if (proximity < 2) proximityPenalty = 50;
        else if (proximity < 5) proximityPenalty = 20;

        this.safetyIndex = Math.max(0, Math.min(100, baseSafety - proximityPenalty));

        return {
            pursuitProgress: this.pursuitProgress,
            threatLevel: this.currentThreatLevel,
            safetyIndex: Math.floor(this.safetyIndex),
            gap: proximity
        };
    }
}
