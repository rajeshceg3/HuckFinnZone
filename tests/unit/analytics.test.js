
import TacticalAnalytics from '../../js/analytics.js';

describe('TacticalAnalytics', () => {
    let analytics;

    beforeEach(() => {
        analytics = new TacticalAnalytics();
    });

    test('initializes with default values', () => {
        expect(analytics.pursuitProgress).toBe(0);
        expect(analytics.currentThreatLevel).toBe('Low');
        expect(analytics.safetyIndex).toBe(100);
    });

    test('reset() restores default values', () => {
        analytics.pursuitProgress = 0.5;
        analytics.currentThreatLevel = 'High';
        analytics.safetyIndex = 20;

        analytics.reset();

        expect(analytics.pursuitProgress).toBe(0);
        expect(analytics.currentThreatLevel).toBe('Low');
        expect(analytics.safetyIndex).toBe(100);
    });

    describe('update()', () => {
        test('updates threat level based on node risk', () => {
            const huckProgress = 0.5;
            const currentNode = { risk: 'Critical' };

            const result = analytics.update(huckProgress, currentNode);

            expect(result.threatLevel).toBe('Critical');
            expect(analytics.currentThreatLevel).toBe('Critical');
        });

        test('calculates pursuit progress with gap based on risk', () => {
            // Test Low Risk (Gap 0.10)
            let huckProgress = 0.5;
            let currentNode = { risk: 'Low' };
            // Target pursuit = 0.5 - 0.10 = 0.40
            // Current = 0
            // Delta = 0.40
            // New = 0 + 0.04 = 0.04 (due to 0.1 easing)

            let result = analytics.update(huckProgress, currentNode);
            expect(result.pursuitProgress).toBeCloseTo(0.04);

            // Run a few times to converge? Or just check direction.
            // Let's manually set pursuitProgress close to target to check convergence logic if needed,
            // but the easing logic is simple.
        });

        test('calculates safety index correctly for Critical risk', () => {
             // Critical Risk -> Base Safety 30
             // Gap is huge -> Proximity Penalty 0
             // Safety = 30

             analytics.pursuitProgress = 0.4; // huck is 0.5, gap 0.1 (10%)
             // update will modify pursuitProgress slightly, but let's assume one tick

             const huckProgress = 0.55; // gap 0.15 > 0.10, so penalty should be 0 or low?
             // actually Update logic:
             // targetGap for Critical is 0.02.
             // targetPursuit = 0.55 - 0.02 = 0.53.
             // delta = 0.53 - 0.4 = 0.13
             // newPursuit = 0.4 + 0.013 = 0.413
             // proximity = (0.55 - 0.413) * 100 = 13.7
             // proximity > 10, so penalty 0.
             // baseSafety 30.
             // result 30.

             const result = analytics.update(huckProgress, { risk: 'Critical' });
             expect(result.safetyIndex).toBe(30);
        });

        test('reduces safety index when proximity is low', () => {
            // Low Risk -> Base Safety 100
            // We want proximity < 10.
            // Let huck = 0.1, pursuit = 0.09. Gap = 0.01 * 100 = 1.
            // Proximity = 1.
            // Penalty = 50 * ((10 - 1)/10)^2 = 50 * 0.9^2 = 50 * 0.81 = 40.5
            // Safety = 100 - 40.5 = 59.5 -> 59 (floored in return)

            // Force the internal state to avoid the easing logic changing it too much
            analytics.pursuitProgress = 0.09;

            // Note: update() modifies pursuitProgress BEFORE calculation.
            // targetGap Low = 0.10.
            // targetPursuit = 0.1 - 0.1 = 0.
            // delta = 0 - 0.09 = -0.09.
            // newPursuit = 0.09 - 0.009 = 0.081.
            // proximity = (0.1 - 0.081) * 100 = 1.9.

            // Penalty = 50 * ((10 - 1.9)/10)^2 = 50 * 0.81^2 = 50 * 0.6561 = 32.8
            // Safety = 100 - 32.8 = 67.2 -> 67.

            const result = analytics.update(0.1, { risk: 'Low' });
            expect(result.gap).toBeLessThan(10);
            expect(result.safetyIndex).toBeLessThan(100);
        });

        test('handles catch up (0 safety) when caught', () => {
            // If huckProgress <= pursuitProgress, safety should be 0.
             analytics.pursuitProgress = 0.5;
             const result = analytics.update(0.5, { risk: 'Critical' });
             // Target gap 0.02.
             // Target pursuit 0.48.
             // Delta = -0.02.
             // New pursuit = 0.498.
             // Gap = 0.5 - 0.498 = 0.002 * 100 = 0.2.

             // Penalty = 50 * ((10-0.2)/10)^2 = 50 * 0.98^2 ~= 48.
             // Base safety Critical = 30.
             // Safety = 30 - 48 = -18 -> 0.

             expect(result.safetyIndex).toBe(0);
        });
    });
});
