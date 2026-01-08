
import MissionControl from '../../js/mission.js';
import IntelSystem from '../../js/intel.js';
import TacticalMap from '../../js/map.js';
import HUDInterface from '../../js/hud.js';
import CommandTerminal from '../../js/terminal.js';
import TacticalAnalytics from '../../js/analytics.js';
import PredictiveEngine from '../../js/engine.js';
import { SCENARIOS } from '../../js/data.js';

// Mock dependencies
jest.mock('../../js/data.js', () => ({
    LOCATIONS: {
        'start': { id: 'start', lat: 0, lng: 0, mile: 0 },
        'mid': { id: 'mid', lat: 10, lng: 10, mile: 50 },
        'end': { id: 'end', lat: 20, lng: 20, mile: 100 }
    },
    SCENARIOS: {
        'historical': ['start', 'mid', 'end'],
        'freedom': ['start', 'end']
    },
    CONFIG: {
        animationSpeed: 1000
    }
}));
jest.mock('../../js/intel.js');
jest.mock('../../js/map.js');
jest.mock('../../js/hud.js');
jest.mock('../../js/terminal.js');
jest.mock('../../js/analytics.js');
jest.mock('../../js/engine.js');

describe('MissionControl', () => {
    let mission;
    let mockIntel;
    let mockMap;
    let mockHud;
    let mockTerminal;
    let mockAnalytics;
    let mockEngine;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = '<div id="app"></div>';

        // Setup Mocks
        mockIntel = {
            setPath: jest.fn(),
            getPoints: jest.fn().mockReturnValue([{lat:0, lng:0}, {lat:10, lng:10}]),
            getDataAtProgress: jest.fn().mockReturnValue({
                currentPoint: { id: 'start', lat: 0, lng: 0 },
                nextPoint: { id: 'mid', lat: 10, lng: 10 },
                interpolated: { lat: 5, lng: 5 },
                index: 0,
                segmentProgress: 0.5,
                targetMile: 25
            }),
            totalDistance: 100
        };
        IntelSystem.mockImplementation(() => mockIntel);

        mockMap = {
            clearActiveLayers: jest.fn(),
            renderMarkers: jest.fn(),
            renderRoute: jest.fn(),
            updateRouteLine: jest.fn(),
            updatePursuitMarker: jest.fn(),
            highlightMarker: jest.fn(),
            panTo: jest.fn(),
            renderGhostPath: jest.fn(),
            renderHazards: jest.fn(),
            clearActiveLayers: jest.fn()
        };
        TacticalMap.mockImplementation(() => mockMap);

        mockHud = {
            els: {
                playBtn: document.createElement('button'),
                slider: document.createElement('input')
            },
            setPlayState: jest.fn(),
            hideDecision: jest.fn(),
            updateProgress: jest.fn(),
            updateStatus: jest.fn(),
            showDecision: jest.fn(),
            showSimulationResults: jest.fn(),
            showStory: jest.fn()
        };
        HUDInterface.mockImplementation(() => mockHud);

        mockTerminal = {
            log: jest.fn()
        };
        CommandTerminal.mockImplementation(() => mockTerminal);

        mockAnalytics = {
            update: jest.fn().mockReturnValue({
                pursuitProgress: 0.1,
                threatLevel: 'Low',
                safetyIndex: 90,
                gap: 5
            })
        };
        TacticalAnalytics.mockImplementation(() => mockAnalytics);

        mockEngine = {
            generateHazards: jest.fn(),
            runSimulation: jest.fn().mockReturnValue({ successRate: 80, logs: [] })
        };
        PredictiveEngine.mockImplementation(() => mockEngine);

        // Instantiate
        mission = new MissionControl();
        // Since requestAnimationFrame is called in init(), we should mock it to avoid infinite loops in tests if we want to test loop()
        // Jest jsdom env has requestAnimationFrame, but we might want to control it.
    });

    test('initializes correctly', () => {
        expect(IntelSystem).toHaveBeenCalled();
        expect(mockIntel.setPath).toHaveBeenCalledWith(SCENARIOS['historical']);
        expect(TacticalMap).toHaveBeenCalled();
        expect(HUDInterface).toHaveBeenCalled();
        expect(CommandTerminal).toHaveBeenCalled();
        expect(TacticalAnalytics).toHaveBeenCalled();
        expect(PredictiveEngine).toHaveBeenCalled();
        expect(mockMap.renderRoute).toHaveBeenCalledWith([]);
    });

    test('togglePlayback toggles isPlaying state', () => {
        expect(mission.state.isPlaying).toBe(false);
        mission.togglePlayback();
        expect(mission.state.isPlaying).toBe(true);
        expect(mockHud.setPlayState).toHaveBeenCalledWith(true);

        mission.togglePlayback();
        expect(mission.state.isPlaying).toBe(false);
        expect(mockHud.setPlayState).toHaveBeenCalledWith(false);
    });

    test('handleDecision switches path and updates state', () => {
        const decision = { targetId: 'ohio-river' };

        // Setup state
        mission.state.progress = 0.5; // Mile 50
        mockIntel.totalDistance = 100;

        mission.handleDecision(decision);

        expect(mockMap.renderGhostPath).toHaveBeenCalled();
        expect(mockIntel.setPath).toHaveBeenCalledWith(SCENARIOS['freedom']);
        expect(mockTerminal.log).toHaveBeenCalledWith(expect.stringContaining("PATH RECALCULATION"), "success");
        expect(mission.state.isPausedForDecision).toBe(false);
        expect(mission.state.isPlaying).toBe(true);
    });

    test('updateMissionData updates map and hud', () => {
        mission.updateMissionData(0.5);

        expect(mockHud.updateProgress).toHaveBeenCalledWith(0.5);
        expect(mockAnalytics.update).toHaveBeenCalled();
        expect(mockMap.updateRouteLine).toHaveBeenCalled();
        expect(mockMap.updatePursuitMarker).toHaveBeenCalled();
        expect(mockHud.updateStatus).toHaveBeenCalled();
    });

    test('triggerDecision pauses playback and shows decision', () => {
        const point = { type: 'decision', title: 'Test Decision' };
        mission.triggerDecision(point);

        expect(mission.state.isPlaying).toBe(false);
        expect(mission.state.isPausedForDecision).toBe(true);
        expect(mockHud.setPlayState).toHaveBeenCalledWith(false);
        expect(mockHud.showDecision).toHaveBeenCalledWith(point);
        expect(mockEngine.generateHazards).toHaveBeenCalledWith(point);
    });

    test('seek updates progress', () => {
        mission.seek(0.8);
        expect(mission.state.progress).toBe(0.8);
        expect(mockHud.updateProgress).toHaveBeenCalledWith(0.8);
    });

    test('handleMarkerClick pauses and jumps to point', () => {
        mission.state.isPlaying = true;
        const point = { mile: 50 };
        mission.handleMarkerClick(point);

        expect(mission.state.isPlaying).toBe(false);
        expect(mission.state.progress).toBe(0.5); // 50 / 100
        expect(mockHud.showStory).toHaveBeenCalledWith(point);
    });
});
