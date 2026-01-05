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
            progress: document.getElementById('timeline-progress'),
            sliderContainer: document.getElementById('timeline-slider-container'),
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
        this.els.progress.style.width = `${percent * 100}%`;
        const val = Math.round(percent * 100);
        this.els.sliderContainer.setAttribute('aria-valuenow', val);
        this.els.sliderContainer.setAttribute('aria-valuetext', `${val} percent complete`);
    }

    setPlayState(isPlaying) {
        this.els.playBtn.innerHTML = isPlaying
            ? '<svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><rect width="4" height="16" x="1" y="1" rx="1"/><rect width="4" height="16" x="9" y="1" rx="1"/></svg>'
            : '<svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor"><path d="M1 1L13 9L1 17V1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    }

    showStory(point) {
        this.els.panelTitle.textContent = point.title;
        this.els.panelBody.innerHTML = `
            <p>${point.content}</p>
            <p style="font-style: italic; border-left: 2px solid var(--accent-color); padding-left: 15px; margin-top: 20px;">
                "${point.quote}"
            </p>
        `;
        this.els.storyPanel.classList.add('active');
    }

    hideStory() {
        this.els.storyPanel.classList.remove('active');
    }

    showDecision(point) {
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
            btn.onclick = () => {
                const event = new CustomEvent('decision-made', { detail: choice });
                document.dispatchEvent(event);
            };
            optionsDiv.appendChild(btn);
        });

        content.appendChild(optionsDiv);
        this.decisionContainer.appendChild(content);
        this.decisionContainer.classList.add('active');

        // Focus the first option
        if (firstBtn) {
            setTimeout(() => firstBtn.focus(), 100);
        }
    }

    hideDecision() {
        this.decisionContainer.classList.remove('active');
    }
}
