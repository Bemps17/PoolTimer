class BilliardTimer {
    constructor() {
        this.domElements = {};
        this.state = {
            remainingTime: 0,
            isRunning: false,
            currentPlayer: 1,
            extensionsUsedInGame: { 1: false, 2: false },
            isExtensionUsedForShot: false,
            lastClickTime: 0,
        };
        this.config = this.loadConfig();
        this.timerInterval = null;
        this.expectedTime = 0;
        this.audio = {
            isInitialized: false,
            context: null,
            bellSynth: null,
            gong: null,
            clickSynth: null,
            countdownSynth: null,
            volumeNode: null
        };
        this.alertsFired = {};
        this.toastTimeout = null;
        this.clickTimeout = null;
        this.panelTouch = { startX: 0, startY: 0, moveX: 0, moveY: 0, isDragging: false };

        this.icons = {
            play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>',
            pause: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>'
        };

        this.initDomElements();
        this.initEventListeners();
        this.applyConfigToUI();
        this.newGame();
    }

    initDomElements() {
        const ids = [
            'container', 'timerDisplay', 'timerScreen', 'p1Status', 'p2Status',
            'controlPanel', 'btnPlayPause', 'btnResetShot', 'btnExtension', 'btnNewGame',
            'menuArbitre', 'overlayMenu', 'panelArbitre', 'fermerPanel', 'panelContent',
            'btnShowHelp', 'overlayHelp', 'panelHelp', 'fermerHelp', 'p1Name', 'p1Color',
            'p2Name', 'p2Color', 'tempsBase', 'tempsExtension', 'seuilAlerte',
            'seuilCritique', 'modeInterface', 'affichageMs', 'volumeSonore', 'vibrationMobile', 
            'autoStartOnReset',
            'sonAlertes', 'sonClics', 'saveToast', 'btnFullScreen', 'themeVisuel', 'appBody'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) this.domElements[id] = el;
        });
        this.domElements.configInputs = this.domElements.panelArbitre.querySelectorAll('input, select');
    }

    initEventListeners() {
        this.domElements.btnPlayPause.addEventListener('click', () => this.togglePlayPause());
        this.domElements.btnResetShot.addEventListener('click', () => { 
            this.playSound('click'); 
            this.resetShot();
        });
        this.domElements.btnExtension.addEventListener('click', () => { this.playSound('click'); this.useExtension(); });
        this.domElements.btnNewGame.addEventListener('click', () => { this.playSound('click'); this.newGame(); });
        
        this.domElements.p1Status.addEventListener('click', () => this.selectPlayer(1));
        this.domElements.p2Status.addEventListener('click', () => this.selectPlayer(2));

        this.domElements.timerScreen.addEventListener('click', (e) => this.handleTimerScreenClick(e));
        
        this.domElements.menuArbitre.addEventListener('click', () => { this.playSound('click'); this.toggleMenu(true); });
        this.domElements.overlayMenu.addEventListener('click', () => this.toggleMenu(false));
        this.domElements.fermerPanel.addEventListener('click', () => this.toggleMenu(false));
        
        this.domElements.btnShowHelp.addEventListener('click', () => { this.playSound('click'); this.toggleHelp(true); });
        this.domElements.overlayHelp.addEventListener('click', () => this.toggleHelp(false));
        this.domElements.fermerHelp.addEventListener('click', () => this.toggleHelp(false));

        this.domElements.configInputs.forEach(element => {
            element.addEventListener('change', () => this.handleConfigChange());
        });

        this.domElements.btnFullScreen.addEventListener('click', () => this.toggleFullScreen());
        document.addEventListener('fullscreenchange', () => this.resizeTimerDisplay());

        window.addEventListener('resize', () => this.resizeTimerDisplay());
        
        this.domElements.panelArbitre.addEventListener('touchstart', (e) => this.handlePanelTouchStart(e), { passive: false });
        this.domElements.panelArbitre.addEventListener('touchmove', (e) => this.handlePanelTouchMove(e), { passive: false });
        this.domElements.panelArbitre.addEventListener('touchend', (e) => this.handlePanelTouchEnd(e));
    }
    
    async initializeAudio() {
        if (this.audio.isInitialized) return;
        try {
            await Tone.start();
            this.audio.context = Tone.getContext();
            this.audio.volumeNode = new Tone.Volume(Tone.dbToGain(this.config.volume)).toDestination();
            this.audio.bellSynth = new Tone.MetalSynth({ frequency: 300, harmonicity: 5.1, modulationIndex: 16, envelope: { attack: 0.001, decay: 1.4, release: 0.2 }, volume: -10 }).connect(this.audio.volumeNode);
            this.audio.gong = new Tone.FMSynth({ harmonicity: 3.1, modulationIndex: 20, envelope: { attack: 0.01, decay: 0.2, release: 0.5 }, modulation: { type: "square" }, modulationEnvelope: { attack: 0.01, decay: 0.5, release: 0.5 } }).connect(this.audio.volumeNode);
            this.audio.clickSynth = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 1, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }).connect(this.audio.volumeNode);
            this.audio.countdownSynth = new Tone.Synth({ oscillator: { type: 'sine' }, volume: -5, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).connect(this.audio.volumeNode);
            this.audio.isInitialized = true;
        } catch (e) {
            console.error("Could not start audio context.", e);
        }
    }

    getDefaultConfig() {
        return {
            tempsBase: 45, tempsExtension: 15, seuilAlerte: 15, seuilCritique: 5,
            volume: -10,
            sonAlertes: true,
            sonClics: true,
            vibration: true, affichageMs: true, modeInterface: 'boutons', 
            autoStartOnReset: true,
            p1Name: 'P1', p1Color: '#3498db', p2Name: 'P2', p2Color: '#e74c3c',
            theme: 'sombre'
        };
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('billiardTimerConfig');
            const defaultConfig = this.getDefaultConfig();
            return savedConfig ? { ...defaultConfig, ...JSON.parse(savedConfig) } : defaultConfig;
        } catch (e) {
            return this.getDefaultConfig();
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('billiardTimerConfig', JSON.stringify(this.config));
        } catch (e) {
            console.error("Failed to save config to localStorage", e);
        }
    }
    
    applyConfigToUI() {
        this.domElements.themeVisuel.value = this.config.theme;
        this.domElements.tempsBase.value = this.config.tempsBase;
        this.domElements.tempsExtension.value = this.config.tempsExtension;
        this.domElements.seuilAlerte.value = this.config.seuilAlerte;
        this.domElements.seuilCritique.value = this.config.seuilCritique;
        this.domElements.volumeSonore.value = Tone.dbToGain(this.config.volume);
        this.domElements.sonAlertes.value = String(this.config.sonAlertes);
        this.domElements.sonClics.value = String(this.config.sonClics);
        this.domElements.vibrationMobile.value = String(this.config.vibration);
        this.domElements.affichageMs.value = String(this.config.affichageMs);
        this.domElements.modeInterface.value = this.config.modeInterface;
        if (this.domElements.autoStartOnReset) {
            this.domElements.autoStartOnReset.value = String(this.config.autoStartOnReset);
        }
        this.domElements.p1Name.value = this.config.p1Name;
        this.domElements.p1Color.value = this.config.p1Color;
        this.domElements.p2Name.value = this.config.p2Name;
        this.domElements.p2Color.value = this.config.p2Color;
        
        this.applyTheme();
        this.updateUI();
    }

    handleConfigChange() {
        this.config.tempsBase = parseInt(this.domElements.tempsBase.value) || 45;
        this.config.tempsExtension = parseInt(this.domElements.tempsExtension.value) || 15;
        this.config.seuilAlerte = parseInt(this.domElements.seuilAlerte.value) || 15;
        this.config.seuilCritique = parseInt(this.domElements.seuilCritique.value) || 5;
        this.config.volume = Tone.gainToDb(parseFloat(this.domElements.volumeSonore.value));
        this.config.sonAlertes = this.domElements.sonAlertes.value === 'true';
        this.config.sonClics = this.domElements.sonClics.value === 'true';
        this.config.vibration = this.domElements.vibrationMobile.value === 'true';
        this.config.affichageMs = this.domElements.affichageMs.value === 'true';
        this.config.modeInterface = this.domElements.modeInterface.value;
        if (this.domElements.autoStartOnReset) {
            this.config.autoStartOnReset = this.domElements.autoStartOnReset.value === 'true';
        }
        this.config.p1Name = this.domElements.p1Name.value.substring(0, 5) || 'P1';
        this.config.p1Color = this.domElements.p1Color.value;
        this.config.p2Name = this.domElements.p2Name.value.substring(0, 5) || 'P2';
        this.config.p2Color = this.domElements.p2Color.value;
        this.config.theme = this.domElements.themeVisuel.value;

        this.saveConfig();
        this.applyConfigToUI();
        this.setupNewShot();
        this.showSaveToast();
    }

    newGame() {
        this.state.extensionsUsedInGame = { 1: false, 2: false };
        this.state.currentPlayer = 1;
        this.setupNewShot();
    }

    setupNewShot() {
        this.pause();
        this.state.remainingTime = this.config.tempsBase * 1000;
        this.state.isExtensionUsedForShot = false;
        this.alertsFired = { warning: false, last_tick_second: 999 };
        this.updateUI();
    }

    resetShot() {
        this.setupNewShot();
        if (this.config.autoStartOnReset) {
            setTimeout(() => this.start(), 50);
        }
    }

    selectPlayer(playerNum) {
        if (this.state.currentPlayer === playerNum) return;
        this.playSound('click');
        this.state.currentPlayer = playerNum;
        this.setupNewShot();
    }
    
    async togglePlayPause() {
        await this.initializeAudio();
        this.playSound('click');
        if (this.state.isRunning) this.pause();
        else this.start();
    }

    start() {
        if (this.state.isRunning || this.state.remainingTime <= 0) return;
        this.state.isRunning = true;
        this.expectedTime = Date.now() + this.state.remainingTime;
        this.timerInterval = setInterval(() => this.tick(), 50);
        this.updateUI();
    }

    pause() {
        if (!this.state.isRunning) return;
        this.state.isRunning = false;
        clearInterval(this.timerInterval);
        this.updateUI();
    }

    tick() {
        const now = Date.now();
        this.state.remainingTime = this.expectedTime - now;

        if (this.state.remainingTime <= 0) {
            this.timeUp();
            return;
        }
        this.updateDisplay();
        this.handleAlerts();
    }
    
    timeUp() {
        this.pause();
        this.state.remainingTime = 0;
        this.updateDisplay();
        this.playSound('gong');
        this.vibrate([300, 50, 300]);
    }

    useExtension() {
        if (!this.state.isRunning || this.state.isExtensionUsedForShot || this.state.extensionsUsedInGame[this.state.currentPlayer]) return;
        this.expectedTime += this.config.tempsExtension * 1000;
        const futureRemainingTime = this.expectedTime - Date.now();
        this.state.isExtensionUsedForShot = true;
        this.state.extensionsUsedInGame[this.state.currentPlayer] = true;
        if (futureRemainingTime > this.config.seuilAlerte * 1000) {
            this.alertsFired.warning = false;
        }
        if (futureRemainingTime > 5000) {
            this.alertsFired.last_tick_second = 999;
        }
        this.updateUI();
    }

    async handleTimerScreenClick(e) {
        if (e.target.id === 'btnExtension') return;
        await this.initializeAudio();
        const now = Date.now();
        if (now - this.state.lastClickTime < 300) {
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }
            this.playSound('click');
            this.resetShot();
            this.state.lastClickTime = 0;
        } else {
            this.clickTimeout = setTimeout(() => {
                this.togglePlayPause();
                this.clickTimeout = null;
            }, 300);
        }
        this.state.lastClickTime = now;
    }

    updateUI() {
        this.updateDisplay();
        this.updatePlayPauseButton();
        this.updateExtensionButton();
        this.updatePlayerIndicators();
        this.updateInterfaceMode();
        this.resizeTimerDisplay();
    }

    updateDisplay() {
        const time = this.state.remainingTime;
        let displayText;

        if (this.config.affichageMs && time < 10000 && time > 0) {
            displayText = (time / 1000).toFixed(1);
        } else {
            displayText = Math.ceil(time / 1000).toString().padStart(2, '0');
        }
        this.domElements.timerDisplay.textContent = displayText;
        
        const container = this.domElements.container;
        const timerDisplay = this.domElements.timerDisplay;
        container.className = 'scoreboard-body';
        timerDisplay.className = 'timer-officiel';
        
        if (time <= this.config.seuilCritique * 1000 && time > 0) {
            timerDisplay.classList.add('state-critical');
            if(this.state.isRunning) container.classList.add('is-flashing-critical');
        } else if (time <= this.config.seuilAlerte * 1000 && time > 0) {
            timerDisplay.classList.add('state-warning');
            if(this.state.isRunning) container.classList.add('is-flashing-warning');
        } else {
            timerDisplay.classList.add('state-default');
        }
        this.updateInterfaceMode();
    }
    
    updatePlayPauseButton() {
        this.domElements.btnPlayPause.innerHTML = this.state.isRunning ? this.icons.pause : this.icons.play;
        this.domElements.btnPlayPause.classList.toggle('playing', this.state.isRunning);
    }

    updateExtensionButton() {
        const extUsedInGame = this.state.extensionsUsedInGame[this.state.currentPlayer];
        const isEnabled = this.state.isRunning && !this.state.isExtensionUsedForShot && !extUsedInGame;
        this.domElements.btnExtension.classList.toggle('disabled', !isEnabled);
        this.domElements.btnExtension.classList.toggle('game-used', extUsedInGame);
    }

    updatePlayerIndicators() {
        ['p1', 'p2'].forEach((p, i) => {
            const playerNum = i + 1;
            const statusEl = this.domElements[`${p}Status`];
            const nameEl = statusEl.querySelector('.player-name');
            const extEl = statusEl.querySelector('.ext-status');

            nameEl.textContent = this.config[`${p}Name`];
            statusEl.classList.toggle('active', this.state.currentPlayer === playerNum);
            
            if (this.state.currentPlayer === playerNum) {
                statusEl.style.borderColor = this.config[`${p}Color`];
                statusEl.style.boxShadow = `0 0 10px ${this.config[`${p}Color`]}80`;
            } else {
                statusEl.style.borderColor = 'transparent';
                statusEl.style.boxShadow = 'none';
            }

            extEl.classList.toggle('ext-available', !this.state.extensionsUsedInGame[playerNum]);
            extEl.classList.toggle('ext-used', this.state.extensionsUsedInGame[playerNum]);
        });
    }
    
    updateInterfaceMode() {
        this.domElements.container.classList.toggle('tactile-mode', this.config.modeInterface === 'tactile');
    }
    
    resizeTimerDisplay() {
        const screen = this.domElements.timerScreen;
        const timer = this.domElements.timerDisplay;
        const screenWidth = screen.clientWidth - 32;
        const screenHeight = screen.clientHeight - 32;
        let fontSize = screenWidth * 0.55;
        if (fontSize > screenHeight) {
            fontSize = screenHeight * 0.9;
        }
        timer.style.fontSize = `${fontSize}px`;
    }

    applyTheme() {
        const body = this.domElements.appBody;
        body.classList.remove('theme-light', 'theme-cyberpunk');
        if (this.config.theme === 'light') {
            body.classList.add('theme-light');
        } else if (this.config.theme === 'cyberpunk') {
            body.classList.add('theme-cyberpunk');
        }
    }
    
    handleAlerts() {
        const remainingSec = this.state.remainingTime / 1000;
        const currentWholeSecond = Math.floor(remainingSec);

        if (remainingSec <= this.config.seuilAlerte && !this.alertsFired.warning) {
            this.alertsFired.warning = true;
            this.playSound('warning');
        }

        if (remainingSec <= 5 && this.state.isRunning) {
            if (currentWholeSecond < this.alertsFired.last_tick_second) {
                this.playSound('countdown_tick');
                this.vibrate(50);
                this.alertsFired.last_tick_second = currentWholeSecond;
            }
        }
    }

    playSound(type) {
        if (!this.audio.isInitialized) return;
        const isAlertType = ['warning', 'countdown_tick', 'gong'].includes(type);
        const isClickType = type === 'click';
        if ((isAlertType && !this.config.sonAlertes) || (isClickType && !this.config.sonClics)) { return; }
        const now = this.audio.context.currentTime;
        if (this.audio.volumeNode) { this.audio.volumeNode.volume.value = this.config.volume; }
        switch(type) {
            case 'warning': this.audio.bellSynth?.triggerAttack(now); break;
            case 'countdown_tick': this.audio.countdownSynth?.triggerAttackRelease('G5', '16n', now); break;
            case 'gong': this.audio.gong?.triggerAttackRelease('A3', '0.5s', now); break;
            case 'click': this.audio.clickSynth?.triggerAttackRelease("C4", "32n", now, 0.5); break;
        }
    }

    vibrate(pattern) {
        if (this.config.vibration && 'vibrate' in navigator && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                console.warn("Vibration failed.", e);
            }
        }
    }

    toggleMenu(open) {
        if (open) { this.applyConfigToUI(); }
        this.domElements.panelArbitre.classList.toggle('active', open);
        this.domElements.overlayMenu.classList.toggle('active', open);
        this.domElements.menuArbitre.classList.toggle('active', open);
    }
    
    toggleHelp(open) {
        this.domElements.panelHelp.classList.toggle('active', open);
        this.domElements.overlayHelp.classList.toggle('active', open);
    }

    showSaveToast() {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        const toast = this.domElements.saveToast;
        toast.classList.add('show');
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Erreur: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    handlePanelTouchStart(e) {
        this.panelTouch.startX = e.touches[0].clientX;
        this.panelTouch.startY = e.touches[0].clientY;
        this.panelTouch.isDragging = false;
    }

    handlePanelTouchMove(e) {
        if (this.domElements.panelContent.scrollTop > 0 && !this.panelTouch.isDragging) return;
        this.panelTouch.moveX = e.touches[0].clientX;
        this.panelTouch.moveY = e.touches[0].clientY;
        const deltaX = this.panelTouch.moveX - this.panelTouch.startX;
        const deltaY = this.panelTouch.moveY - this.panelTouch.startY;
        if (!this.panelTouch.isDragging) {
            if (Math.abs(deltaX) > Math.abs(deltaY) + 5) {
                this.panelTouch.isDragging = true;
                this.domElements.panelArbitre.style.transition = 'none';
            } else { return; }
        }
        if (this.panelTouch.isDragging) {
            e.preventDefault();
            if (deltaX > 0) {
                this.domElements.panelArbitre.style.transform = `translateX(${deltaX}px)`;
            }
        }
    }

    handlePanelTouchEnd(e) {
        if (!this.panelTouch.isDragging) return;
        const panel = this.domElements.panelArbitre;
        panel.style.transition = 'right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        panel.style.transform = '';
        const deltaX = this.panelTouch.moveX - this.panelTouch.startX;
        const panelWidth = panel.offsetWidth;
        if (deltaX > panelWidth * 0.3) {
            this.toggleMenu(false);
        }
        this.panelTouch.isDragging = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BilliardTimer();
});
