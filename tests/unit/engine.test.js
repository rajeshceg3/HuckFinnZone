
import PredictiveEngine from '../../js/engine.js';

describe('PredictiveEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new PredictiveEngine();
    });

    describe('getRiskValue', () => {
        test('returns correct value for "Low"', () => {
            expect(engine.getRiskValue('Low')).toBe(20);
        });
        test('returns correct value for "Medium"', () => {
            expect(engine.getRiskValue('Medium')).toBe(40);
        });
        test('returns correct value for "High"', () => {
            expect(engine.getRiskValue('High')).toBe(60);
        });
        test('returns correct value for "Critical"', () => {
            expect(engine.getRiskValue('Critical')).toBe(80);
        });
        test('returns default value for unknown risk', () => {
            expect(engine.getRiskValue('Unknown')).toBe(30);
        });
    });

    describe('simulateRun', () => {
        // Deterministic tests are hard with Math.random, so we might need to mock it
        // or rely on statistical probability if we ran many times (but that's slow/flaky).
        // Better to mock Math.random.

        let randomSpy;

        beforeEach(() => {
            randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5); // Random factor will be (0.5 * 40) - 20 = 0
        });

        afterEach(() => {
            randomSpy.mockRestore();
        });

        test('returns true when risk is low', () => {
            // baseRisk = 20
            // speed = 50 -> penalty = 15
            // stealth = 50 -> bonus = 20
            // effective = 20 + 15 - 20 + 0 = 15
            // 15 < 80 -> True
            expect(engine.simulateRun(20, { speed: 50, stealth: 50 })).toBe(true);
        });

        test('returns false when risk is extremely high', () => {
            // baseRisk = 90
            // speed = 100 -> penalty = 30
            // stealth = 0 -> bonus = 0
            // effective = 90 + 30 - 0 + 0 = 120
            // 120 < 80 -> False
            expect(engine.simulateRun(90, { speed: 100, stealth: 0 })).toBe(false);
        });
    });

    describe('runSimulation', () => {
         test('returns valid structure', () => {
             const startPoint = { risk: 'Low' };
             const choice = { consequence: 'Safe', targetId: 'test-node' };
             const result = engine.runSimulation(startPoint, choice);

             expect(result).toHaveProperty('successRate');
             expect(typeof result.successRate).toBe('number');
             expect(result).toHaveProperty('logs');
             expect(Array.isArray(result.logs)).toBe(true);
         });

         test('adjusts risk based on choice consequence', () => {
             // We can spy on simulateRun to see what baseRisk it receives
             const simulateSpy = jest.spyOn(engine, 'simulateRun');
             const startPoint = { risk: 'Medium' }; // 40

             // Case 1: Safe -> -20
             engine.runSimulation(startPoint, { consequence: 'Safe', targetId: 'A' });
             // 40 - 20 = 20
             expect(simulateSpy).toHaveBeenCalledWith(20, expect.any(Object));

             simulateSpy.mockClear();

             // Case 2: Risk increases -> +20
             engine.runSimulation(startPoint, { consequence: 'Risk increases', targetId: 'B' });
             // 40 + 20 = 60
             expect(simulateSpy).toHaveBeenCalledWith(60, expect.any(Object));
         });
    });

    describe('generateHazards', () => {
        test('returns array of hazards', () => {
            const point = { lat: 0, lng: 0 };
            const hazards = engine.generateHazards(point);

            expect(Array.isArray(hazards)).toBe(true);
            expect(hazards.length).toBeGreaterThanOrEqual(3);
            expect(hazards[0]).toHaveProperty('lat');
            expect(hazards[0]).toHaveProperty('lng');
            expect(hazards[0]).toHaveProperty('radius');
            expect(hazards[0]).toHaveProperty('intensity');
        });
    });
});
