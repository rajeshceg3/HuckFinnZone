/**
 * Command & Control Terminal
 */
export default class CommandTerminal {
    constructor(missionControl) {
        this.mc = missionControl;
        this.isOpen = false;
        this.history = [];
        this.historyIndex = -1;

        this.els = {
            container: document.getElementById('terminal-container'),
            output: document.getElementById('terminal-output'),
            input: document.getElementById('terminal-input'),
            toggle: document.getElementById('terminal-toggle'),
            clock: document.getElementById('terminal-clock')
        };

        this.secretIntel = {
            'st-petersburg': "Subject 001 (Finn) shows signs of rebellion against social programming. Monitor closely.",
            'jacksons-island': "Detected unauthorized rendezvous with Subject 002 (Jim). Potential Alliance formation.",
            'cairo': "Navigational Error confirmed. Divergence from 'Freedom' vector: 100%. Critical failure in pathfinding.",
            'grangerfords': "Local conflict zone active. High probability of collateral damage. Aristocratic feudalism simulation in progress.",
            'duke-king': "Hostile entities identified. Class: Social Engineers/Parasites. Threat level: Moderate.",
            'wilks': "Psychological profile update: Subject 001 displaying advanced empathy traits overriding survival instincts.",
            'phelps': "Critical Decision Point reached. Subject 001 rejecting theological constraints. Moral Singularity achieved.",
            'ohio-river': "Subject has successfully navigated the fog barrier. Probability of successful extraction: 85%.",
            'freedom-port': "MISSION COMPLETE. Subject has reached safe harbor. The timeline has been altered."
        };

        this.setupListeners();
        this.startClock();
    }

    setupListeners() {
        this.els.toggle.addEventListener('click', () => this.toggle());

        // Keyboard shortcut (~)
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                this.toggle();
            }
        });

        this.els.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.els.input.value.trim();
                if (cmd) {
                    this.execute(cmd);
                    this.history.push(cmd);
                    this.historyIndex = this.history.length;
                    this.els.input.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.els.input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.els.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.els.input.value = '';
                }
            }
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.els.container.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            this.els.input.focus();
        }
    }

    log(msg, type = 'info') {
        const div = document.createElement('div');
        div.className = `log-entry log-${type}`;
        div.textContent = `> ${msg}`;
        this.els.output.appendChild(div);
        this.els.output.scrollTop = this.els.output.scrollHeight;
    }

    execute(input) {
        this.log(input, 'system');
        const parts = input.split(' ');
        const cmd = parts[0].toUpperCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'HELP':
                this.log('AVAILABLE COMMANDS:', 'success');
                this.log('  STATUS     - System diagnostics', 'info');
                this.log('  LOCATE [ID]- Pan to location', 'info');
                this.log('  INTEL [ID] - Decrypt classified data', 'info');
                this.log('  LIST       - List location IDs', 'info');
                this.log('  PLAY/PAUSE - Toggle timeline', 'info');
                this.log('  EXECUTE [ID] - Execute a decision option', 'warn');
                this.log('  CLEAR      - Clear terminal', 'info');
                break;

            case 'STATUS':
                const point = this.mc.intel.getDataAtProgress(this.mc.state.progress).currentPoint;
                this.log(`MISSION CLOCK: ${this.mc.state.progress.toFixed(2)}%`, 'info');
                this.log(`CURRENT SECTOR: ${point.title}`, 'info');
                this.log(`RISK LEVEL: ${point.risk}`, point.risk === 'Critical' ? 'error' : 'warn');
                if (this.mc.state.isPausedForDecision) {
                    this.log('ALERT: DECISION REQUIRED. AWAITING INPUT.', 'error');
                }
                break;

            case 'LIST':
                this.log('KNOWN LOCATIONS:', 'info');
                this.mc.intel.getPoints().forEach(p => {
                    this.log(`  ${p.id} : ${p.title}`, 'system');
                });
                break;

            case 'LOCATE':
                if (args.length === 0) {
                    this.log('Usage: LOCATE [location_id]', 'error');
                    return;
                }
                const targetId = args[0].toLowerCase();
                const loc = this.mc.intel.getPoints().find(p => p.id === targetId);
                if (loc) {
                    this.mc.map.panTo(loc.lat, loc.lng);
                    this.log(`Panning to ${loc.title}...`, 'success');
                } else {
                    this.log(`Location '${targetId}' not found.`, 'error');
                }
                break;

            case 'INTEL':
                if (args.length === 0) {
                    this.log('Usage: INTEL [location_id]', 'error');
                    return;
                }
                const intelId = args[0].toLowerCase();
                if (this.secretIntel[intelId]) {
                    this.log('DECRYPTING...', 'warn');
                    setTimeout(() => {
                        this.log(this.secretIntel[intelId], 'success');
                    }, 500);
                } else {
                    this.log('No classified intelligence found for this sector.', 'error');
                }
                break;

            case 'PLAY':
                if (!this.mc.state.isPlaying && !this.mc.state.isPausedForDecision) this.mc.togglePlayback();
                else if (this.mc.state.isPausedForDecision) this.log('Cannot resume: Decision required.', 'error');
                this.log('Playback initiated.', 'success');
                break;

            case 'PAUSE':
                if (this.mc.state.isPlaying) this.mc.togglePlayback();
                this.log('Playback paused.', 'warn');
                break;

            case 'EXECUTE':
                // Check if we are at a decision point
                const currentPoint = this.mc.intel.getDataAtProgress(this.mc.state.progress).currentPoint;
                if (!this.mc.state.isPausedForDecision || !currentPoint.choices) {
                    this.log('No active decision context.', 'error');
                    return;
                }

                if (args.length === 0) {
                    this.log('Usage: EXECUTE [option_id]', 'error');
                    this.log('Available Options:', 'info');
                    currentPoint.choices.forEach(c => this.log(`  ${c.id} : ${c.label}`, 'system'));
                    return;
                }

                const optId = args[0].toLowerCase();
                const choice = currentPoint.choices.find(c => c.id === optId);

                if (choice) {
                    this.log(`Executing option: ${choice.label}`, 'success');
                    const event = new CustomEvent('decision-made', { detail: choice });
                    document.dispatchEvent(event);
                } else {
                    this.log(`Invalid option ID: ${optId}`, 'error');
                }
                break;

            case 'CLEAR':
                this.els.output.innerHTML = '';
                break;

            default:
                this.log(`Unknown command: ${cmd}`, 'error');
        }
    }

    startClock() {
        setInterval(() => {
            const now = new Date();
            this.els.clock.textContent = now.toLocaleTimeString('en-US', {hour12: false});
        }, 1000);
    }
}
