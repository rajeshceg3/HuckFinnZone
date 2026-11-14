import setupMissionControls from './controls.js';
/**
 * Manages the Heads-Up Display and Story Panel
 */
export default class HUDInterface {
    constructor() {
        this.els = {
            phase: document.getElementById('hud-phase'),
            statusText: document.getElementById('hud-status-text'),
            statusLight: document.getElementById('hud-status-light'),
            distance: document.getElementById('hud-distance'),
            storyPanel: document.getElementById('story-panel'),
            panelTitle: document.getElementById('panel-title'),
            panelBody: document.getElementById('panel-body'),
            closeBtn: document.getElementById('close-panel'),
            playBtn: document.getElementById('play-pause-btn'),
            slider: document.getElementById('timeline-slider'),
            // Decision elements (created dynamically or pre-existing? Let's create dynamically for now or add to HTML)
            app: document.getElementById('app')
        };

        this.els.closeBtn.addEventListener('click', () => this.hideStory());

        // Create decision container
        this.decisionContainer = document.createElement('div');
        this.decisionContainer.id = 'decision-modal';
        this.decisionContainer.setAttribute('role', 'dialog');
        this.decisionContainer.setAttribute('aria-modal', 'true');
        this.decisionContainer.setAttribute('aria-labelledby', 'decision-title');
        this.els.app.appendChild(this.decisionContainer);

        this.decisionContainer.inert = true;

        // Global Focus Trap Listener for the container
        this.decisionContainer.addEventListener('keydown', (e) => {
            if (!this.decisionContainer.classList.contains('active')) return;

            const isTab = (e.key === 'Tab' || e.keyCode === 9);
            if (!isTab) return;

            const focusableElements = this.decisionContainer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });

        this.currentDecisionPoint = null;
        this.controls = setupMissionControls(this);
    }

    updateStatus(point, analytics) {
        this.els.phase.textContent = point.phase;
        this.els.distance.textContent = point.mile;

        let riskText = point.risk;
        if (analytics) {
             riskText += ` | SAFETY: ${analytics.safetyIndex}%`;
        }
        this.els.statusText.textContent = riskText;

        // Update risk light
        this.els.statusLight.className = 'status-indicator';
        if (point.risk === 'Critical' || (analytics && analytics.safetyIndex < 30)) {
             this.els.statusLight.classList.add('status-critical');
        } else if (point.risk === 'High' || (analytics && analytics.safetyIndex < 60)) {
             this.els.statusLight.classList.add('status-warning');
        }
    }

    updateProgress(percent) {
        this.els.slider.value = percent * 100;
        this.els.slider.setAttribute('aria-valuenow', Math.round(percent * 100));
    }

    setPlayState(isPlaying) {
        this.els.playBtn.setAttribute('aria-label', isPlaying ? 'Pause Mission' : 'Play Mission');
        this.els.playBtn.innerHTML = isPlaying
            ? '<svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><rect width="4" height="16" x="1" y="1" rx="1"/><rect width="4" height="16" x="9" y="1" rx="1"/></svg>'
            : '<svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><path d="M1 1L13 9L1 17V1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    }

    showStory(point) {
        this.els.panelTitle.textContent = point.title;
        this.els.panelBody.innerHTML = `
            <p>${point.content}</p>
            <p style="font-style: italic; border-left: 2px solid var(--accent-color); padding-left: 15px; margin-top: 20px;">
                "${point.quote}"
            </p>
        `;
        this.controls.close(false);
        document.dispatchEvent(new Event('close-terminal'));
        this.storyReturn = document.activeElement;
        this.els.storyPanel.hidden = false;
        this.els.storyPanel.inert = false;
        this.els.storyPanel.classList.add('active');
        this.els.storyPanel.scrollTop = 0;
        this.els.closeBtn.focus();
    }

    hideStory() {
        this.els.storyPanel.classList.remove('active');
        this.els.storyPanel.hidden = true;
        this.els.storyPanel.inert = true;
        if(this.storyReturn?.isConnected) this.storyReturn.focus();
    }

    showDecision(point) {
        this.controls.close(false);
        this.hideStory();
        document.dispatchEvent(new Event('close-terminal'));
        this.decisionContainer.inert = false;
        this.currentDecisionPoint = point;
        this.decisionContainer.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'decision-content';

        const title = document.createElement('h2');
        title.id = 'decision-title';
        title.textContent = `TACTICAL INTERVENTION: ${point.title}`;
        content.appendChild(title);

        const desc = document.createElement('p');
        desc.textContent = "Critical node reached. Choose your vector.";
        content.appendChild(desc);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'decision-options';

        // Focus trap helper
        let firstBtn = null;
        let lastBtn = null;

        point.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'decision-btn';
            if (index === 0) firstBtn = btn;
            lastBtn = btn;

            btn.innerHTML = `
                <div class="btn-label">${choice.label}</div>
                <div class="btn-desc">${choice.description}</div>
                <div class="btn-risk">${choice.consequence}</div>
            `;

            // Primary Action: Commit
            btn.onclick = () => {
                const event = new CustomEvent('decision-made', { detail: choice });
                document.dispatchEvent(event);
            };

            // Secondary Action: Simulate
            const simBtn = document.createElement('button');
            simBtn.className = 'sim-btn-trigger';
            simBtn.setAttribute('aria-label', `Run prediction: ${choice.label}`);
            simBtn.textContent = "[ RUN PREDICTION ]";
            simBtn.onclick = (e) => {
                e.stopPropagation(); // Don't trigger choice
                this.showSimulationUI(choice);
            };

            optionsDiv.appendChild(btn);
            optionsDiv.appendChild(simBtn);
        });

        content.appendChild(optionsDiv);
        const timelineBtn = document.createElement('button');
        timelineBtn.className = 'hud-btn';
        timelineBtn.textContent = 'Return to timeline';
        timelineBtn.addEventListener('click', () => {
            this.hideDecision();
            document.dispatchEvent(new Event('timeline-return'));
            document.getElementById('mission-toggle').click();
        });
        content.appendChild(timelineBtn);
        this.decisionContainer.appendChild(content);
        this.decisionContainer.classList.add('active');

        // Focus the first option
        if (firstBtn) {
            setTimeout(() => firstBtn.focus(), 100);
        }

    }

    showSimulationUI(choice) {
        // Clear decision modal content temporarily
        const content = this.decisionContainer.querySelector('.decision-content');
        content.innerHTML = '';

        const title = document.createElement('h2');
        title.id = 'decision-title';
        title.textContent = `PREDICTIVE MODELING: ${choice.label}`;
        content.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'sim-controls';

        controls.innerHTML = `
            <div class="sim-slider-row">
                <label>AGGRESSION / SPEED</label>
                <input type="range" id="sim-speed" min="0" max="100" value="50">
            </div>
            <div class="sim-slider-row">
                <label>STEALTH / EVASION</label>
                <input type="range" id="sim-stealth" min="0" max="100" value="50">
            </div>
            <div id="sim-output" class="sim-output">READY TO INITIALIZE...</div>
        `;
        const note = document.createElement('p');
        note.className = 'model-note';
        note.textContent = 'Fictional game model, not a historical forecast.';
        content.appendChild(note);
        content.appendChild(controls);
        controls.querySelector('#sim-speed').setAttribute('aria-label', 'Aggression / speed');
        controls.querySelector('#sim-stealth').setAttribute('aria-label', 'Stealth / evasion');

        const btnRow = document.createElement('div');
        btnRow.className = 'sim-actions';

        const runBtn = document.createElement('button');
        runBtn.className = 'hud-btn';
        runBtn.textContent = "EXECUTE SIMULATION";
        runBtn.onclick = () => {
            const speed = document.getElementById('sim-speed').value;
            const stealth = document.getElementById('sim-stealth').value;

            document.getElementById('sim-output').innerHTML = "CALCULATING PROBABILITIES...<br><span class='blink'>...</span>";

            document.dispatchEvent(new CustomEvent('simulate-request', {
                detail: { choice, speed, stealth }
            }));
        };

        const backBtn = document.createElement('button');
        backBtn.className = 'hud-btn secondary';
        backBtn.textContent = "BACK";
        backBtn.onclick = () => {
            if(this.currentDecisionPoint) this.showDecision(this.currentDecisionPoint);
        };

        btnRow.appendChild(runBtn);
        btnRow.appendChild(backBtn);
        content.appendChild(btnRow);
        runBtn.focus();
    }

    showSimulationResults(results) {
        const output = document.getElementById('sim-output');
        if (output) {
            const color = results.successRate > 75 ? '#0f0' : (results.successRate > 40 ? '#fa0' : '#f03');
            output.innerHTML = `
                SIMULATION RESULT:<br>
                <span style="color: ${color}; font-size: 1.2em; font-weight: bold;">SUCCESS PROBABILITY: ${results.successRate.toFixed(1)}%</span>
            `;
        }
    }

    hideDecision() {
        this.decisionContainer.classList.remove('active');
        this.currentDecisionPoint = null;
        this.decisionContainer.inert = true;
        // Return focus to map or app container to ensure keyboard nav continues
        this.els.app.focus();
    }
}
