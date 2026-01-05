import { LOCATIONS, SCENARIOS, CONFIG } from './data.js';
import IntelSystem from './intel.js';
import TacticalMap from './map.js';
import HUDInterface from './hud.js';
import CommandTerminal from './terminal.js';
import TacticalAnalytics from './analytics.js';

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
        this.analytics = new TacticalAnalytics();

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
        // Only clear active layers (route and markers), preserving ghosts
        this.map.clearActiveLayers();
        this.map.renderMarkers(this.intel.getPoints(), (point) => this.handleMarkerClick(point));

        // For Fog of War, we should NOT render the full route initially.
        // We start with an empty route or just the start point.
        // The loop() will update it based on progress.
        this.map.renderRoute([]);
    }

    handleDecision(decision) {
        console.log("Decision Made:", decision);

        // Capture current mileage before switching
        const { targetMile } = this.intel.getDataAtProgress(this.state.progress);

        // 1. Calculate new path based on decision
        // For now, hardcoded logic for the Cairo decision
        if (decision.targetId === 'ohio-river') {
            // Save current path as ghost before switching
            // For FoW: Ghost path should probably be the *full* old path
            // OR just the explored part. Let's show full old path as "Alternate History"
            this.map.renderGhostPath(this.intel.getPoints());

            // Switch to Freedom Path
            this.intel.setPath(SCENARIOS['freedom']);
            this.terminal.log("PATH RECALCULATION: FREEDOM VECTOR ENGAGED", "success");
        } else {
            // Stay on Historical Path (or explicit historical choice)
            this.terminal.log("PATH CONFIRMED: HISTORICAL TIMELINE", "warn");
            // No change needed if we are already on historical, but if we supported re-entrant choices...
        }

        // Recalculate progress to maintain geographic position (mileage)
        // New Progress = Old Mile / New Total Distance
        if (this.intel.totalDistance > 0) {
            let newProgress = targetMile / this.intel.totalDistance;
            // Clamp to 0-1
            newProgress = Math.max(0, Math.min(1, newProgress));

            // Update state
            this.state.progress = newProgress;

            // Force an update so the interpolation is correct immediately
            this.updateMissionData(newProgress);
        }

        // 2. Resume playback
        this.state.isPausedForDecision = false;
        this.state.isPlaying = true;
        this.hud.setPlayState(true);
        this.hud.hideDecision();

        // 3. Refresh Map Visuals
        this.refreshMap();

        // Reset analytics relative to new path
        // this.analytics.reset(); // Actually, don't reset fully, pursuit continues?
        // Let's keep pursuit but maybe adjust gap?
        // For now, simplicity: the analytics update logic will self-correct.
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
            // Allow seeking even if paused for decision (user might want to review)
            // If they seek away from the decision point, we should probably hide the decision?
            // Yes, let's allow it but cancel decision mode if we move significantly.

            const rect = slider.getBoundingClientRect();
            const x = clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));

            // If we are seeking, we are manually overriding.
            // If we seek away, we might want to cancel the decision block?
            if (this.state.isPausedForDecision) {
                 this.hud.hideDecision();
                 this.state.isPausedForDecision = false;
                 this.terminal.log("Decision context aborted by manual override.", "warn");
            }

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
            const duration = CONFIG.animationSpeed;
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

        // Get Huck's Position
        // logicalPoint is the node we are "at" or "leaving"
        // visualPoint is the node we are visually closest to or "arriving at"
        const { currentPoint, nextPoint, index, segmentProgress, interpolated } = this.intel.getDataAtProgress(progress);

        // Determine the "Display Point" for HUD and Logic
        // If we are > 95% through a segment, we are effectively arriving at the next point.
        let displayPoint = currentPoint;
        if (segmentProgress > 0.95 && nextPoint) {
            displayPoint = nextPoint;
        }

        // --- Analytics Update ---
        const analyticsData = this.analytics.update(progress, displayPoint);

        // Get Pursuit Position
        const pursuitData = this.intel.getDataAtProgress(analyticsData.pursuitProgress);

        // Update Map Visuals (Fog of War & Vectors)
        // 1. Update Route Line: Only draw from start to Huck's current position
        // We need all points up to index, plus the interpolated point
        const points = this.intel.getPoints();
        const exploredPoints = points.slice(0, index + 1).map(p => [p.lat, p.lng]);
        exploredPoints.push([interpolated.lat, interpolated.lng]);
        this.map.updateRouteLine(exploredPoints);

        // 2. Update Pursuit Marker
        if (pursuitData && pursuitData.interpolated) {
            this.map.updatePursuitMarker(pursuitData.interpolated.lat, pursuitData.interpolated.lng);
        }

        // Update Status & Highlight when passing markers
        // We use displayPoint.id to track logical changes
        if (displayPoint.id !== this.state.currentDisplayId) {

            const isMovingForward = progress > (this.state.lastProgress || 0);
            this.state.currentDisplayId = displayPoint.id;
            this.state.lastProgress = progress; // Track direction

            // Pass analytics to HUD
            this.hud.updateStatus(displayPoint, analyticsData);

            // Highlight the marker we are closest to
            // If displayPoint is nextPoint, we want to highlight that index
            // We need to find the index of displayPoint in the data array
            const displayIndex = this.intel.getPoints().indexOf(displayPoint);
            if (displayIndex >= 0) {
                 this.map.highlightMarker(displayIndex);
            }

            // Trigger Decision if we have arrived at a decision node
            // and we are playing (not seeking past it)
            if (displayPoint.type === 'decision' && isMovingForward && this.state.isPlaying) {
                 this.triggerDecision(displayPoint);
            }
        } else {
             // Continuous update for safety index, but throttled
             if (!this.frameCount) this.frameCount = 0;
             this.frameCount++;
             if (this.frameCount % 10 === 0) {
                 this.hud.updateStatus(displayPoint, analyticsData);
             }
        }

        // Alert if Safety drops low (once per threshold)
        if (analyticsData.safetyIndex < 30 && !this.lowSafetyAlertTriggered) {
             this.terminal.log("WARNING: THREAT PROXIMITY CRITICAL", "error");
             this.lowSafetyAlertTriggered = true;
        } else if (analyticsData.safetyIndex > 40) {
             this.lowSafetyAlertTriggered = false;
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
