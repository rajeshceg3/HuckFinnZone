/* Explicit, persistent disclosure. Nothing retires on a timer. */
export default function setupMissionControls(hud) {
    const toggle = document.getElementById('mission-toggle');
    const panel = document.getElementById('mission-panel');
    panel.append(document.getElementById('timeline-control'), document.getElementById('terminal-toggle'));
    const close = (restore = true) => {
        panel.hidden = true;
        panel.inert = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (restore) toggle.focus();
    };
    toggle.addEventListener('click', () => {
        if (!panel.hidden) return close();
        hud.hideStory();
        document.dispatchEvent(new Event('close-terminal'));
        panel.hidden = false;
        panel.inert = false;
        toggle.setAttribute('aria-expanded', 'true');
        document.getElementById('mission-close').focus();
    });
    document.getElementById('mission-close').addEventListener('click', () => close());
    document.addEventListener('close-mission', () => { close(false); hud.hideStory(); });
    document.addEventListener('keydown', (e) => {
        if (hud.decisionContainer.classList.contains('active')) return;
        const terminal = document.getElementById('terminal-container');
        const active = !terminal.hidden ? terminal : !hud.els.storyPanel.hidden ? hud.els.storyPanel : !panel.hidden ? panel : null;
        if (!active) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            if (active === terminal) document.dispatchEvent(new Event('close-terminal'));
            else if (active === hud.els.storyPanel) hud.hideStory();
            else close();
        }
        if (e.key === 'Tab') {
            const items = [...active.querySelectorAll('button,input,a[href]')].filter(x=>x.getClientRects().length);
            if (!items.length) return;
            const first=items[0], last=items[items.length-1];
            if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
            else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
    });
    return {close};
}
