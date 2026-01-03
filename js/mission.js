import { LOCATIONS, SCENARIOS } from './data.js';
import IntelSystem from './intel.js';
import TacticalMap from './map.js';
import HUDInterface from './hud.js';
import CommandTerminal from './terminal.js';

/**
 * Main Application Controller
 */
class MissionControl {
    constructor() {
        this.intel = new IntelSystem(LOCATIONS);
        // Initialize with historical path
        this.intel.setPath(SCENARIOS['historical']);

        this.map = new TacticalMap('map', 36.0, -90.5);
        this.hud = new HUDInterface();
        this.terminal = new CommandTerminal(this);

        this.state = {
            progress: 0, // 0.0 to 1.0
            isPlaying: false,
            lastFrameTime: 0,
            currentIndex: -1,
            isPausedForDecision: false
        };

        this.init();
    }

    init() {
        // Render Map Elements
        this.refreshMap();

        // Setup Listeners
        this.hud.els.playBtn.addEventListener('click', () => this.togglePlayback());

        // Timeline Interaction (Click, Drag, Keyboard)
        this.setupTimelineInteraction();

        // Listen for decision events from HUD
        document.addEventListener('decision-made', (e) => {
            this.handleDecision(e.detail);
        });

        // Start Loop
        requestAnimationFrame((t) => this.loop(t));

        // Initial State
        this.updateMissionData(0);
    }

    refreshMap() {
        // Clear existing layers if necessary (map.js handles addition, but not clearing yet)
        // For now, we assume simple rendering on top or we need to add clear logic to map.
        // Let's rely on map.renderRoute updating if we call it again? No, it adds new lines.
        // We need a clear method in TacticalMap.
        // Since I can't easily edit map.js right now without a separate tool call,
        // I will assume for step 2 we just render.
        // Wait, I should update map.js to support clearing.

        this.map.clearLayers();
        this.map.renderMarkers(this.intel.getPoints(), (point) => this.handleMarkerClick(point));
        this.map.renderRoute(this.intel.getPoints());
    }

    handleDecision(decision) {
        console.log("Decision Made:", decision);
        // 1. Calculate new path based on decision
        // For now, hardcoded logic for the Cairo decision
        if (decision.targetId === 'ohio-river') {
            // Switch to Freedom Path
            this.intel.setPath(SCENARIOS['freedom']);
            this.terminal.log("PATH RECALCULATION: FREEDOM VECTOR ENGAGED", "success");
        } else {
            // Stay on Historical Path (or explicit historical choice)
            this.terminal.log("PATH CONFIRMED: HISTORICAL TIMELINE", "warn");
            // No change needed if we are already on historical, but if we supported re-entrant choices...
        }

        // 2. Resume playback
        this.state.isPausedForDecision = false;
        this.state.isPlaying = true;
        this.hud.setPlayState(true);
        this.hud.hideDecision();

        // 3. Refresh Map Visuals
        this.refreshMap();
    }

    handleMarkerClick(point) {
        // Pause if playing
        if (this.state.isPlaying) this.togglePlayback();

        // Jump to that point based on mileage
        const pct = point.mile / this.intel.totalDistance;
        this.seek(pct);

        this.hud.showStory(point);
    }

    togglePlayback() {
        if (this.state.isPausedForDecision) return; // Locked

        this.state.isPlaying = !this.state.isPlaying;
        this.hud.setPlayState(this.state.isPlaying);
        if (this.state.isPlaying && this.state.progress >= 1) {
            this.state.progress = 0; // Restart if at end
        }
    }

    setupTimelineInteraction() {
        const slider = this.hud.els.sliderContainer;
        let isDragging = false;

        // Mouse/Touch Handling
        const updateFromEvent = (clientX) => {
            if (this.state.isPausedForDecision) return;

            const rect = slider.getBoundingClientRect();
            const x = clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));
            this.seek(pct);
        };

        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateFromEvent(e.clientX);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                updateFromEvent(e.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Keyboard Handling
        slider.addEventListener('keydown', (e) => {
            if (this.state.isPausedForDecision) return;

            const STEP = 0.05; // 5% jump
            let newProgress = this.state.progress;

            if (e.key === 'ArrowRight') {
                newProgress = Math.min(1, this.state.progress + STEP);
                this.seek(newProgress);
            } else if (e.key === 'ArrowLeft') {
                newProgress = Math.max(0, this.state.progress - STEP);
                this.seek(newProgress);
            }
        });
    }

    seek(pct) {
        this.state.progress = pct;
        this.updateMissionData(pct);
    }

    loop(timestamp) {
        if (!this.state.lastFrameTime) this.state.lastFrameTime = timestamp;
        const deltaTime = timestamp - this.state.lastFrameTime;
        this.state.lastFrameTime = timestamp;

        if (this.state.isPlaying && !this.state.isPausedForDecision) {
            // Calculate increment based on duration
            const duration = 15000;
            const increment = deltaTime / duration;

            this.state.progress += increment;

            if (this.state.progress >= 1) {
                this.state.progress = 1;
                this.togglePlayback();
            }

            this.updateMissionData(this.state.progress);
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    updateMissionData(progress) {
        this.hud.updateProgress(progress);

        const { currentPoint, index, interpolated } = this.intel.getDataAtProgress(progress);

        // Update Status & Highlight when passing markers
        if (index !== this.state.currentIndex) {

            // CHECK FOR DECISION POINT
            // We only trigger if we are "entering" the node and it is a decision node
            // and we haven't just made the decision (avoid loop)
            // For simplicity: Trigger when we hit the exact index of a decision node?
            // Or when we are close?
            // Better: Trigger when currentPoint changes to a decision node.

            // Wait, if we just made a decision, we are AT the node. We don't want to trigger again.
            // We can check if we are moving forward.

            const isMovingForward = index > this.state.currentIndex;
            this.state.currentIndex = index;
            this.hud.updateStatus(currentPoint);
            this.map.highlightMarker(index);

            if (currentPoint.type === 'decision' && isMovingForward && this.state.isPlaying) {
                 this.triggerDecision(currentPoint);
            }
        }

        // Smoothly pan map if playing
        if (this.state.isPlaying && interpolated) {
            this.map.panTo(interpolated.lat, interpolated.lng, true);
        } else if (!this.state.isPlaying && index !== this.state.currentIndex) {
            // Snap to marker if not playing (seeking)
            this.map.panTo(currentPoint.lat, currentPoint.lng);
        }
    }

    triggerDecision(point) {
        this.state.isPlaying = false;
        this.state.isPausedForDecision = true;
        this.hud.setPlayState(false);
        this.hud.showDecision(point);
        this.terminal.log(`ALERT: DECISION POINT REACHED - ${point.title.toUpperCase()}`, 'warn');
    }
}

// Initialize Mission
document.addEventListener('DOMContentLoaded', () => {
    const mission = new MissionControl();
});
