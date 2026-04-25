/* ═══════════════════════════════════════════════════════════════
   SYMPHONY OF RUIN  ·  symphony.js
   Core engine — loaded by index.html (the skeleton).
    Fetches introduction.json for all data; falls back to built-in
   defaults when running on file:// (no server).
   ═══════════════════════════════════════════════════════════════ */

(function () {

    class Symphony {

        /* ── constructor receives parsed introduction.json data ── */
        constructor(data) {
            /* DOM references */
            this.container          = document.getElementById('symphonyContainer');
            this.enterWrapper       = document.getElementById('enterSymphonyWrapper');
            this.enterBtn           = document.getElementById('enterSymphonyBtn');
            this.pauseIndicator     = document.getElementById('pauseIndicator');
            this.endState           = document.getElementById('endState');
            this.endTextContainer   = document.getElementById('endTextContainer');
            this.endEnterHint       = document.getElementById('endEnterHint');
            this.grainCanvas        = document.getElementById('film-grain-canvas');
            this.grainCtx           = this.grainCanvas.getContext('2d');
            this.dustCanvas         = document.getElementById('dust-motes-canvas');
            this.dustCtx            = this.dustCanvas.getContext('2d');
            this.proceduralCanvas   = document.getElementById('procedural-bg-canvas');
            this.proceduralCtx      = this.proceduralCanvas.getContext('2d');
            this.letterboxTop       = document.getElementById('letterboxTop');
            this.letterboxBottom    = document.getElementById('letterboxBottom');
            this.lightLeakOrange    = document.getElementById('lightLeakOrange');
            this.lightLeakWhite     = document.getElementById('lightLeakWhite');
            this.lightLeakAmber     = document.getElementById('lightLeakAmber');
            this.historicalCommentary = document.getElementById('historicalCommentary');
            this.commentaryText     = document.getElementById('commentaryText');
            this.commentaryCursor   = document.getElementById('commentaryCursor');
            this.inflationCounter   = document.getElementById('inflationCounter');
            this.inflationValue     = document.getElementById('inflationValue');

            this.videoLayers = {
                1: document.getElementById('videoLayer1'),
                2: document.getElementById('videoLayer2'),
                3: document.getElementById('videoLayer3'),
                4: document.getElementById('videoLayer4'),
            };
            this.videos = {
                1: document.getElementById('video1'),
                2: document.getElementById('video2'),
                3: document.getElementById('video3'),
                4: document.getElementById('video4'),
            };
            this.video4split        = document.getElementById('video4split');
            this.splitScreenOverlay = document.getElementById('splitScreenOverlay');

            this.overlayIronCross     = document.getElementById('overlayIronCross');
            this.overlayStarvingChild = document.getElementById('overlayStarvingChild');
            this.overlayPutschMedal   = document.getElementById('overlayPutschMedal');
            this.overlayElectionPoster= document.getElementById('overlayElectionPoster');
            this.overlayMapVersailles = document.getElementById('overlayMapVersailles');

            this.quoteM1 = document.getElementById('quoteM1');
            this.quoteM2 = document.getElementById('quoteM2');
            this.quoteM3 = document.getElementById('quoteM3');
            this.quoteM4 = document.getElementById('quoteM4');

            this.dateStamp1 = document.getElementById('dateStamp1');
            this.dateStamp2 = document.getElementById('dateStamp2');
            this.dateStamp3 = document.getElementById('dateStamp3');
            this.dateStamp4 = document.getElementById('dateStamp4');
            this.newsTicker     = document.getElementById('newsTicker');

            this.barGroup1 = document.getElementById('barGroup1');
            this.barGroup2 = document.getElementById('barGroup2');
            this.barGroup3 = document.getElementById('barGroup3');
            this.barFill1  = document.getElementById('barFill1');
            this.barFill2  = document.getElementById('barFill2');
            this.barFill3  = document.getElementById('barFill3');
            this.vignetteOverlay = document.getElementById('vignetteOverlay');

            this.musicLayer1    = document.getElementById('musicLayer1');
            this.musicLayer2    = document.getElementById('musicLayer2');
            this.musicLayer3    = document.getElementById('musicLayer3');
            this.musicLayer4    = document.getElementById('musicLayer4');
            this.telephoneRing  = document.getElementById('telephoneRing');

            /* ── data from introduction.json ── */
            this.timeline       = data.timeline;
            this.commentaryData = data.commentary;

            /* ── runtime state ── */
            this.audioContext       = null;
            this.gainNodes          = {};
            this.isPlaying          = false;
            this.isPaused           = false;
            this.hasStarted         = false;
            this.startTime          = 0;
            this.pausedAt           = 0;
            this.totalPauseDuration = 0;
            this.pauseStartTime     = 0;
            this.currentMovement    = 0;
            this.animationFrameId   = null;
            this.grainAnimId        = null;
            this.dustAnimId         = null;
            this.proceduralAnimId   = null;
            this.lastTapTime        = 0;
            this.endStateReached    = false;
            this.lightLeakTimers    = [];
            this.dustParticles      = [];
            this.inflationAnimationId    = null;
            this.inflationLastFrameIndex = -1;
            this.commentaryTimer        = null;
            this.commentaryTypingTimer  = null;
            this.videosLoaded   = { 1: false, 2: false, 3: false, 4: false };
            this.videoErrorCount= { 1: 0, 2: 0, 3: 0, 4: 0 };
            this.proceduralHue  = 0;

            /* bind methods */
            this.runTimeline             = this.runTimeline.bind(this);
            this.togglePause             = this.togglePause.bind(this);
            this.handleKeyDown           = this.handleKeyDown.bind(this);
            this.handleClick             = this.handleClick.bind(this);
            this.initGrainCanvas         = this.initGrainCanvas.bind(this);
            this.animateGrain            = this.animateGrain.bind(this);
            this.initDustCanvas          = this.initDustCanvas.bind(this);
            this.animateDust             = this.animateDust.bind(this);
            this.initDustParticles       = this.initDustParticles.bind(this);
            this.initProceduralCanvas    = this.initProceduralCanvas.bind(this);
            this.animateProceduralBg     = this.animateProceduralBg.bind(this);
            this.scheduleLightLeaks      = this.scheduleLightLeaks.bind(this);
            this.triggerLightLeak        = this.triggerLightLeak.bind(this);
            this.animateInflation        = this.animateInflation.bind(this);
            this.typeCommentary          = this.typeCommentary.bind(this);
            this.clearCommentaryTyping   = this.clearCommentaryTyping.bind(this);
            this.handleVideoError        = this.handleVideoError.bind(this);

            this.init();
        }

        /* ══════════════════════════════════════════════════════
           STATIC DEFAULTS — used as fallback when introduction.json
           cannot be fetched (e.g. direct file:// open)
           ══════════════════════════════════════════════════════ */
        static defaults() {
            return {
                timeline: {
                    openingStart: 0, letterboxCinematicIn: 2.5,
                    movement1Start: 4.0, movement1VideoFadeIn: 5.0,
                    movement1QuoteIn: 9.0, movement1IronCrossIn: 4.5, movement1IronCrossOut: 18.0,
                    movement1StarvingChildIn: 18.0, movement1DateStampIn: 3.5, movement1DateStampOut: 30.0,
                    movement1InflationIn: 8.0, movement1InflationOut: 33.0,
                    movement1CommentaryIn: 6.0, movement1CommentaryOut: 33.5, movement1End: 34.0,
                    transition1: 35.0, movement2Start: 35.5,
                    movement2QuoteIn: 40.0, movement2QuoteOut: 55.0,
                    movement2DateStampIn: 36.0, movement2DateStampOut: 58.0,
                    movement2CommentaryIn: 37.0, movement2CommentaryOut: 59.5, movement2End: 60.0,
                    transition2: 60.5, movement3Start: 61.0,
                    movement3QuoteIn: 70.0, movement3MedalIn: 64.0, movement3MedalOut: 88.0,
                    movement3DateStampIn: 62.0, movement3DateStampOut: 93.0,
                    movement3CommentaryIn: 63.0, movement3CommentaryOut: 94.5, movement3End: 95.0,
                    transition3: 95.5, movement4Start: 96.0, movement4SplitReveal: 98.0,
                    movement4QuoteIn: 103.0, movement4QuoteOut: 132.0, movement4PosterIn: 108.0,
                    movement4DateStampIn: 97.0,
                    movement4Bar1In: 100.0, movement4Bar2In: 110.0, movement4Bar3In: 120.0,
                    movement4CommentaryIn: 98.5, movement4CommentaryOut: 139.0, movement4End: 140.0,
                    newsTickerIn: 98.0, endFreeze: 140.0, endGhostAppear: 142.0,
                    endTextReveal: 144.0, endComplete: 152.0,
                },
                commentary: {
                    1: { text: 'November 1918: World War I ends. The Kaiser abdicates, the republic is proclaimed, and the peace terms leave Germany shaken and unstable.', date: '1918–1919' },
                    2: { text: 'February 1920: In Munich, the party is renamed NSDAP. Hitler presents the 25-point program, and the movement stays small but grows louder.', date: '1920–1921' },
                    3: { text: 'November 1923: Hyperinflation peaks at 4.2 trillion Mark per US Dollar. The Munich putsch fails, Hitler is jailed, and the trial gives him national attention.', date: '1923–1924' },
                    4: { text: '1924–1928: During the "Golden Twenties," recovery returns and NSDAP vote shares stay low. Hitler reorganizes and waits for a larger crisis.', date: '1924–1928' },
                },
            };
        }

        /* ══════════════════════════════════════════════════════
           INIT
           ══════════════════════════════════════════════════════ */
        init() {
            this.initGrainCanvas();
            this.animateGrain();
            this.initDustCanvas();
            this.initDustParticles();
            this.animateDust();
            this.initProceduralCanvas();
            this.animateProceduralBg();

            Object.entries(this.videos).forEach(([num, video]) => {
                video.addEventListener('error', () => this.handleVideoError(parseInt(num)));
                video.addEventListener('loadeddata', () => {
                    this.videosLoaded[parseInt(num)] = true;
                    console.log(`Video ${num} loaded successfully`);
                });
                video.addEventListener('stalled', () => {
                    if (video.readyState < 2) this.handleVideoError(parseInt(num));
                });
            });
            if (this.video4split) {
                this.video4split.addEventListener('error', () => {
                    console.log('Split video error — using fallback');
                });
            }

            this.enterBtn.addEventListener('click', () => this.startSymphony());
            this.enterWrapper.addEventListener('click', (e) => {
                if (e.target === this.enterWrapper || e.target.closest('.enter-symphony-inner'))
                    this.startSymphony();
            });
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('click', this.handleClick);
            document.addEventListener('touchstart', this.handleClick, { passive: true });
            this.endEnterHint.addEventListener('click', () => this.navigateToMovements());
            window.addEventListener('resize', () => {
                this.initGrainCanvas();
                this.initDustCanvas();
                this.initProceduralCanvas();
            });
        }

        handleVideoError(movementNum) {
            this.videoErrorCount[movementNum]++;
            console.warn(`Video for movement ${movementNum} failed (attempt ${this.videoErrorCount[movementNum]}) — using procedural background fallback`);
            if (this.currentMovement === movementNum || !this.hasStarted)
                this.proceduralCanvas.style.opacity = '1';
        }

        /* ══════════════════════════════════════════════════════
           PROCEDURAL BACKGROUND CANVAS
           ══════════════════════════════════════════════════════ */
        initProceduralCanvas() {
            this.proceduralCanvas.width  = window.innerWidth;
            this.proceduralCanvas.height = window.innerHeight;
            this.proceduralCanvas.style.opacity = '0.55';
        }

        animateProceduralBg() {
            if (!this.proceduralCtx) return;
            const ctx = this.proceduralCtx;
            const w = this.proceduralCanvas.width;
            const h = this.proceduralCanvas.height;
            const t = performance.now() * 0.001;

            this.proceduralHue = (this.proceduralHue + 0.015) % 360;

            const baseGrad = ctx.createRadialGradient(w * 0.35, h * 0.4, w * 0.05, w * 0.5, h * 0.5, w * 0.9);
            const hueShift = Math.sin(t * 0.3) * 15;
            baseGrad.addColorStop(0, `hsl(${20 + hueShift}, 15%, 6%)`);
            baseGrad.addColorStop(0.5, `hsl(${15 + hueShift}, 10%, 3%)`);
            baseGrad.addColorStop(1, '#000000');
            ctx.fillStyle = baseGrad;
            ctx.fillRect(0, 0, w, h);

            for (let i = 0; i < 4; i++) {
                const bx = w * (0.2 + Math.sin(t * 0.4 + i * 1.7) * 0.35);
                const by = h * (0.3 + Math.cos(t * 0.35 + i * 2.1) * 0.3);
                const br = Math.min(w, h) * (0.2 + Math.sin(t * 0.25 + i) * 0.12);
                const blobGrad = ctx.createRadialGradient(bx, by, br * 0.2, bx, by, br);
                blobGrad.addColorStop(0, `rgba(40,20,10,${0.08 + Math.sin(t + i) * 0.03})`);
                blobGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = blobGrad;
                ctx.fillRect(0, 0, w, h);
            }

            ctx.globalAlpha = 0.03;
            for (let x = 0; x < w; x += 8 + Math.floor(Math.random() * 20)) {
                const streakHeight = 20 + Math.random() * h * 0.4;
                const streakY = Math.random() * h;
                ctx.fillStyle = Math.random() < 0.5 ? '#332211' : '#1a1008';
                ctx.fillRect(x, streakY, 1.5, streakHeight);
            }
            ctx.globalAlpha = 1;

            if (Math.random() < 0.12) {
                const fx = Math.random() * w;
                const fy = Math.random() * h;
                const fr = 80 + Math.random() * 300;
                const flickerGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
                flickerGrad.addColorStop(0, 'rgba(60,35,18,0.06)');
                flickerGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = flickerGrad;
                ctx.fillRect(0, 0, w, h);
            }

            this.proceduralAnimId = requestAnimationFrame(() => this.animateProceduralBg());
        }

        /* ══════════════════════════════════════════════════════
           FILM GRAIN & DUST MOTES
           ══════════════════════════════════════════════════════ */
        initGrainCanvas() {
            this.grainCanvas.width  = window.innerWidth;
            this.grainCanvas.height = window.innerHeight;
        }
        animateGrain() {
            if (!this.grainCtx) return;
            const w = this.grainCanvas.width;
            const h = this.grainCanvas.height;
            const imageData = this.grainCtx.createImageData(w, h);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.floor(Math.random() * 35);
                data[i] = noise; data[i+1] = noise; data[i+2] = noise;
                data[i+3] = Math.floor(Math.random() * 25);
            }
            this.grainCtx.putImageData(imageData, 0, 0);
            this.grainAnimId = requestAnimationFrame(() => this.animateGrain());
        }

        initDustCanvas() {
            this.dustCanvas.width  = window.innerWidth;
            this.dustCanvas.height = window.innerHeight;
        }
        initDustParticles() {
            this.dustParticles = [];
            for (let i = 0; i < 16; i++) {
                this.dustParticles.push({
                    x: Math.random() * this.dustCanvas.width,
                    y: Math.random() * this.dustCanvas.height,
                    radius: 0.4 + Math.random() * 1.2,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.22 - 0.15,
                    opacity: 0.14 + Math.random() * 0.28,
                    twinkleSpeed: 0.004 + Math.random() * 0.014,
                    twinkleOffset: Math.random() * Math.PI * 2,
                });
            }
        }
        animateDust() {
            if (!this.dustCtx) return;
            const ctx = this.dustCtx;
            const w = this.dustCanvas.width;
            const h = this.dustCanvas.height;
            ctx.clearRect(0, 0, w, h);
            this.dustParticles.forEach(p => {
                p.x += p.speedX; p.y += p.speedY;
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;
                const twinkle = 0.5 + 0.5 * Math.sin(performance.now() * p.twinkleSpeed + p.twinkleOffset);
                const alpha = p.opacity * twinkle;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,240,220,${alpha})`; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,220,180,${alpha * 0.10})`; ctx.fill();
            });
            this.dustAnimId = requestAnimationFrame(() => this.animateDust());
        }

        /* ══════════════════════════════════════════════════════
           COMMENTARY TYPEWRITER
           ══════════════════════════════════════════════════════ */
        clearCommentaryTyping() {
            if (this.commentaryTypingTimer) { clearInterval(this.commentaryTypingTimer); this.commentaryTypingTimer = null; }
            if (this.commentaryTimer) { clearTimeout(this.commentaryTimer); this.commentaryTimer = null; }
            this.commentaryText.textContent = '';
            this.commentaryCursor.style.display = 'none';
        }

        typeCommentary(movementNum) {
            this.clearCommentaryTyping();
            const data = this.commentaryData[movementNum];
            if (!data) return;
            const fullText = data.text;
            const dateStr  = data.date;
            let charIndex  = 0;
            this.historicalCommentary.classList.add('visible');
            this.commentaryCursor.style.display = 'inline-block';
            this.commentaryText.innerHTML = `<span class="commentary-date">[${dateStr}]</span> `;

            const baseDelay = 28;
            this.commentaryTypingTimer = setInterval(() => {
                if (this.isPaused) return;
                if (charIndex < fullText.length) {
                    const char = fullText[charIndex];
                    const extraDelay = (char === '.' || char === ',' || char === ';') ? 120 : (char === ' ' ? 15 : 0);
                    this.commentaryText.innerHTML = `<span class="commentary-date">[${dateStr}]</span> ` + fullText.substring(0, charIndex + 1);
                    charIndex++;
                    if (extraDelay > 0 && this.commentaryTypingTimer) {
                        clearInterval(this.commentaryTypingTimer);
                        this.commentaryTypingTimer = setTimeout(() => {
                            if (!this.isPaused) this.typeCommentaryContinue(movementNum, charIndex, fullText, dateStr);
                        }, extraDelay);
                    }
                } else {
                    this.clearCommentaryTyping();
                    this.commentaryText.innerHTML = `<span class="commentary-date">[${dateStr}]</span> ` + fullText;
                    this.commentaryCursor.style.display = 'inline-block';
                }
            }, baseDelay);
        }

        typeCommentaryContinue(movementNum, charIndex, fullText, dateStr) {
            const baseDelay = 28;
            this.commentaryTypingTimer = setInterval(() => {
                if (this.isPaused) return;
                if (charIndex < fullText.length) {
                    const char = fullText[charIndex];
                    const extraDelay = (char === '.' || char === ',' || char === ';') ? 120 : (char === ' ' ? 15 : 0);
                    this.commentaryText.innerHTML = `<span class="commentary-date">[${dateStr}]</span> ` + fullText.substring(0, charIndex + 1);
                    charIndex++;
                    if (extraDelay > 0 && this.commentaryTypingTimer) {
                        clearInterval(this.commentaryTypingTimer);
                        this.commentaryTypingTimer = setTimeout(() => {
                            if (!this.isPaused) this.typeCommentaryContinue(movementNum, charIndex, fullText, dateStr);
                        }, extraDelay);
                    }
                } else {
                    this.clearCommentaryTyping();
                    this.commentaryText.innerHTML = `<span class="commentary-date">[${dateStr}]</span> ` + fullText;
                    this.commentaryCursor.style.display = 'inline-block';
                }
            }, baseDelay);
        }

        /* ══════════════════════════════════════════════════════
           START / AUDIO
           ══════════════════════════════════════════════════════ */
        async startSymphony() {
            if (this.hasStarted) return;
            try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
            if (this.audioContext) this.setupAudioRouting();
            this.enterWrapper.classList.add('hidden');
            this.letterboxTop.classList.add('cinematic');
            this.letterboxBottom.classList.add('cinematic');
            Object.values(this.videos).forEach(v => { v.muted = false; v.volume = 0.8; });
            if (this.video4split) { this.video4split.muted = false; this.video4split.volume = 0.7; }
            if (this.musicLayer1) { this.musicLayer1.volume = 0.35; this.musicLayer1.play().catch(() => {}); }
            this.hasStarted = true;
            this.isPlaying  = true;
            this.isPaused   = false;
            this.startTime  = performance.now();
            this.totalPauseDuration = 0;
            this.currentMovement = 0;
            this.endStateReached = false;
            Object.values(this.videos).forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
            if (this.video4split) { this.video4split.currentTime = 0; this.video4split.play().catch(() => {}); }
            this.scheduleLightLeaks();
            this.runTimeline();
            this.proceduralCanvas.style.opacity = '0.55';
        }

        setupAudioRouting() {
            const ac = this.audioContext;
            const masterGain = ac.createGain();
            masterGain.gain.value = 0.85;
            masterGain.connect(ac.destination);

            Object.entries(this.videos).forEach(([num, el]) => {
                try {
                    const s = ac.createMediaElementSource(el);
                    const g = ac.createGain(); g.gain.value = 0.8;
                    s.connect(g); g.connect(masterGain);
                    this.gainNodes['video' + num] = g;
                } catch (e) {}
            });
            if (this.video4split) try {
                const s = ac.createMediaElementSource(this.video4split);
                const g = ac.createGain(); g.gain.value = 0.7;
                s.connect(g); g.connect(masterGain);
                this.gainNodes['video4split'] = g;
            } catch (e) {}

            [
                { el: this.musicLayer1, key: 'music1' },
                { el: this.musicLayer2, key: 'music2' },
                { el: this.musicLayer3, key: 'music3' },
                { el: this.musicLayer4, key: 'music4' },
                { el: this.telephoneRing, key: 'telephone' },
            ].forEach(({ el, key }) => {
                if (!el) return;
                try {
                    const s = ac.createMediaElementSource(el);
                    const g = ac.createGain(); g.gain.value = 0;
                    s.connect(g); g.connect(masterGain);
                    this.gainNodes[key] = g;
                } catch (e) {}
            });
            if (this.gainNodes['music1']) this.gainNodes['music1'].gain.value = 0.35;
        }

        /* ══════════════════════════════════════════════════════
           PLAYBACK CONTROL
           ══════════════════════════════════════════════════════ */
        getElapsed() {
            if (!this.isPlaying || this.isPaused) return this.pausedAt;
            return (performance.now() - this.startTime - this.totalPauseDuration) / 1000;
        }

        togglePause() {
            if (!this.hasStarted || this.endStateReached) return;
            if (this.isPaused) {
                this.isPaused = false;
                this.totalPauseDuration += (performance.now() - this.pauseStartTime);
                this.pauseIndicator.classList.remove('visible');
                Object.values(this.videos).forEach(v => { if (v.paused) v.play().catch(() => {}); });
                if (this.video4split && this.video4split.paused) this.video4split.play().catch(() => {});
                this.resumeAllMusic();
                this.runTimeline();
            } else {
                this.isPaused = true;
                this.pauseStartTime = performance.now();
                this.pausedAt = this.getElapsed();
                this.pauseIndicator.classList.add('visible');
                Object.values(this.videos).forEach(v => v.pause());
                if (this.video4split) this.video4split.pause();
                this.pauseAllMusic();
                if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
            }
        }

        pauseAllMusic() {
            [this.musicLayer1, this.musicLayer2, this.musicLayer3, this.musicLayer4].forEach(el => {
                if (el && !el.paused) el.pause();
            });
        }
        resumeAllMusic() {
            const e = this.getElapsed();
            const t = this.timeline;
            if (e < t.movement2Start && this.musicLayer1) this.musicLayer1.play().catch(() => {});
            if (e >= t.movement2Start && e < t.movement3Start && this.musicLayer2) this.musicLayer2.play().catch(() => {});
            if (e >= t.movement3Start && e < t.movement4Start && this.musicLayer3) this.musicLayer3.play().catch(() => {});
            if (e >= t.movement4Start && this.musicLayer4) this.musicLayer4.play().catch(() => {});
        }

        handleKeyDown(e) {
            if (!this.hasStarted) return;
            if (e.code === 'Space' || e.code === 'KeyP') {
                e.preventDefault();
                if (this.endStateReached) { this.navigateToMovements(); return; }
                this.togglePause();
            }
            if (this.endStateReached && e.key) this.navigateToMovements();
        }
        handleClick(e) {
            if (!this.hasStarted) return;
            if (this.endStateReached) { this.navigateToMovements(); return; }
            const now = performance.now();
            if (now - this.lastTapTime < 350) { this.togglePause(); this.lastTapTime = 0; }
            else this.lastTapTime = now;
        }

        /* ── End-state navigation: shows introduction movement overlay ── */
        navigateToMovements() {
            const overlay = document.createElement('div');
            overlay.style.cssText = [
                'position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;',
                'align-items:center;justify-content:center;background:rgba(0,0,0,0.96);',
                'gap:1.8rem;cursor:auto;',
            ].join('');

            overlay.innerHTML = `
                <p style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.35em;color:rgba(255,255,255,0.3);text-transform:uppercase;">Revisit the introduction</p>
                <div style="display:flex;flex-direction:column;gap:1rem;width:100%;max-width:340px;">
                    ${[
                        ['I',  'The Wound',  '1918–1919', 'introduction/movement-1.html'],
                        ['II', 'The Birth',  '1920–1921', 'introduction/movement-2.html'],
                        ['III','The Putsch', '1923',      'introduction/movement-3.html'],
                        ['IV', 'The Wait',   '1924–1928', 'introduction/movement-4.html'],
                    ].map(([num, title, period, href]) => `
                        <a href="${href}" style="display:flex;align-items:center;gap:1.2rem;padding:0.9rem 1.5rem;border:1px solid rgba(255,255,255,0.08);text-decoration:none;transition:border-color 0.3s;">
                            <span style="font-family:'JetBrains Mono',monospace;font-size:0.55rem;color:rgba(255,255,255,0.3);letter-spacing:0.2em;min-width:2rem;">${num}</span>
                            <span style="font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:0.12em;color:rgba(255,255,255,0.8);">${title}</span>
                            <span style="font-family:'Inter',sans-serif;font-size:0.55rem;color:rgba(255,255,255,0.3);margin-left:auto;letter-spacing:0.1em;">${period}</span>
                        </a>
                    `).join('')}
                </div>
                <button style="margin-top:1rem;background:transparent;border:none;font-family:'Inter',sans-serif;font-size:0.55rem;letter-spacing:0.2em;color:rgba(255,255,255,0.25);cursor:pointer;text-transform:uppercase;" id="closeMovementNav">✕ Close</button>
            `;

            document.body.appendChild(overlay);
            overlay.querySelector('#closeMovementNav').addEventListener('click', () => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.4s';
                setTimeout(() => overlay.remove(), 400);
            });
        }

        /* ══════════════════════════════════════════════════════
           LIGHT LEAKS
           ══════════════════════════════════════════════════════ */
        scheduleLightLeaks() {
            const sched = () => {
                if (!this.isPlaying || this.isPaused || this.endStateReached) return;
                const delay = 7000 + Math.random() * 16000;
                const timer = setTimeout(() => {
                    if (!this.isPlaying || this.isPaused || this.endStateReached) return;
                    this.triggerLightLeak(); sched();
                }, delay);
                this.lightLeakTimers.push(timer);
            };
            sched();
        }
        triggerLightLeak() {
            const leaks = [this.lightLeakOrange, this.lightLeakWhite, this.lightLeakAmber];
            const chosen = leaks[Math.floor(Math.random() * leaks.length)];
            if (!chosen) return;
            chosen.classList.add('flash');
            const off = setTimeout(() => chosen.classList.remove('flash'), 90 + Math.random() * 160);
            this.lightLeakTimers.push(off);
        }

        /* ══════════════════════════════════════════════════════
           INFLATION COUNTER
           ══════════════════════════════════════════════════════ */
        animateInflation() {
            if (this.currentMovement !== 1 || this.isPaused) { this.inflationAnimationId = null; return; }
            const elapsed = this.getElapsed();
            const t = this.timeline;
            const rawProgress = Math.max(0, Math.min(1, (elapsed - t.movement1InflationIn) / (t.movement1InflationOut - t.movement1InflationIn)));

            const totalFrames = 220;
            const frameProgress = Math.pow(rawProgress, 2.3);
            const frameIndex = Math.floor(frameProgress * totalFrames);

            if (frameIndex !== this.inflationLastFrameIndex || rawProgress >= 1) {
                this.inflationLastFrameIndex = frameIndex;
                const steppedProgress = Math.min(1, frameIndex / totalFrames);
                const valueProgress = Math.pow(steppedProgress, 5.2);
                const startVal = 4.2, endVal = 4200000000000;
                const val = startVal + (endVal - startVal) * valueProgress;

                let displayText;
                if      (val >= 1e12) displayText = (val / 1e12).toFixed(1) + ' trillion Mark';
                else if (val >= 1e9)  displayText = (val / 1e9).toFixed(1)  + ' billion Mark';
                else if (val >= 1e6)  displayText = (val / 1e6).toFixed(1)  + ' million Mark';
                else if (val >= 1000) displayText = Math.round(val).toLocaleString('en-US') + ' Mark';
                else                  displayText = val.toFixed(2) + ' Mark';
                this.inflationValue.textContent = displayText;
            }

            if (rawProgress > 0.92 && !this.inflationCounter.classList.contains('bloody-active'))
                this.inflationCounter.classList.add('bloody-active');
            else if (rawProgress <= 0.92 && this.inflationCounter.classList.contains('bloody-active'))
                this.inflationCounter.classList.remove('bloody-active');

            this.inflationAnimationId = requestAnimationFrame(() => this.animateInflation());
        }

        /* ══════════════════════════════════════════════════════
           MAIN TIMELINE LOOP
           ══════════════════════════════════════════════════════ */
        runTimeline() {
            if (this.isPaused || this.endStateReached) return;
            const elapsed = this.getElapsed();
            const t = this.timeline;

            /* movement transitions */
            if      (elapsed >= t.movement4Start && this.currentMovement !== 4) this.enterMovement(4);
            else if (elapsed >= t.movement3Start && elapsed < t.movement4Start && this.currentMovement !== 3) this.enterMovement(3);
            else if (elapsed >= t.movement2Start && elapsed < t.movement3Start && this.currentMovement !== 2) this.enterMovement(2);
            else if (elapsed >= t.movement1Start && elapsed < t.movement2Start && this.currentMovement !== 1) this.enterMovement(1);

            if (elapsed >= t.letterboxCinematicIn && !this.letterboxTop.classList.contains('cinematic')) {
                this.letterboxTop.classList.add('cinematic');
                this.letterboxBottom.classList.add('cinematic');
            }

            /* ── movement 1 ── */
            if (this.currentMovement === 1) {
                if (elapsed >= t.movement1IronCrossIn  && elapsed < t.movement1IronCrossOut)  this.overlayIronCross.classList.add('visible');
                else this.overlayIronCross.classList.remove('visible');
                if (elapsed >= t.movement1StarvingChildIn && elapsed < t.movement1End) this.overlayStarvingChild.classList.add('visible');
                else this.overlayStarvingChild.classList.remove('visible');
                if (elapsed >= t.movement1QuoteIn && elapsed < t.movement1End) this.quoteM1.classList.add('visible');
                else this.quoteM1.classList.remove('visible');
                if (elapsed >= t.movement1DateStampIn && elapsed < t.movement1DateStampOut) this.dateStamp1.classList.add('visible');
                else this.dateStamp1.classList.remove('visible');
                if (elapsed >= t.movement1InflationIn && elapsed < t.movement1InflationOut) {
                    this.inflationCounter.classList.add('visible');
                    if (!this.inflationAnimationId) this.animateInflation();
                } else {
                    this.inflationCounter.classList.remove('visible');
                    this.inflationCounter.classList.remove('bloody-active');
                    if (this.inflationAnimationId) { cancelAnimationFrame(this.inflationAnimationId); this.inflationAnimationId = null; }
                }
                if (elapsed >= t.movement1CommentaryIn && elapsed < t.movement1CommentaryOut && !this.commentaryTypingTimer && this.commentaryText.textContent === '')
                    this.typeCommentary(1);
                else if ((elapsed < t.movement1CommentaryIn || elapsed >= t.movement1CommentaryOut) && this.commentaryText.textContent !== '' && this.currentMovement === 1) {
                    this.clearCommentaryTyping(); this.historicalCommentary.classList.remove('visible');
                }
                if (elapsed >= t.movement1End - 2 && elapsed < t.movement1End) { this.videoLayers[1].classList.add('fading'); this.fadeVideoAudio(1, 0, 2); }
                if (elapsed >= t.movement1End - 3 && this.musicLayer2 && this.musicLayer2.paused) {
                    this.musicLayer2.volume = 0; this.musicLayer2.play().catch(() => {}); this.fadeAudioGain('music2', 0, 0.25, 3);
                }
            }

            /* ── movement 2 ── */
            if (this.currentMovement === 2) {
                if (elapsed >= t.movement2QuoteIn && elapsed < t.movement2QuoteOut) this.quoteM2.classList.add('visible');
                else this.quoteM2.classList.remove('visible');
                if (elapsed >= t.movement2DateStampIn && elapsed < t.movement2DateStampOut) this.dateStamp2.classList.add('visible');
                else this.dateStamp2.classList.remove('visible');
                if (elapsed >= t.movement2CommentaryIn && elapsed < t.movement2CommentaryOut && !this.commentaryTypingTimer && this.commentaryText.textContent === '')
                    this.typeCommentary(2);
                else if ((elapsed < t.movement2CommentaryIn || elapsed >= t.movement2CommentaryOut) && this.commentaryText.textContent !== '' && this.currentMovement === 2) {
                    this.clearCommentaryTyping(); this.historicalCommentary.classList.remove('visible');
                }
                if (elapsed >= t.movement2End - 2 && elapsed < t.movement2End) { this.videoLayers[2].classList.add('fading'); this.fadeVideoAudio(2, 0, 2); }
            }

            /* ── movement 3 ── */
            if (this.currentMovement === 3) {
                if (elapsed >= t.movement3MedalIn && elapsed < t.movement3MedalOut) this.overlayPutschMedal.classList.add('visible');
                else this.overlayPutschMedal.classList.remove('visible');
                if (elapsed >= t.movement3QuoteIn && elapsed < t.movement3End) this.quoteM3.classList.add('visible');
                else this.quoteM3.classList.remove('visible');
                if (elapsed >= t.movement3DateStampIn && elapsed < t.movement3DateStampOut) this.dateStamp3.classList.add('visible');
                else this.dateStamp3.classList.remove('visible');
                if (elapsed >= t.movement3CommentaryIn && elapsed < t.movement3CommentaryOut && !this.commentaryTypingTimer && this.commentaryText.textContent === '')
                    this.typeCommentary(3);
                else if ((elapsed < t.movement3CommentaryIn || elapsed >= t.movement3CommentaryOut) && this.commentaryText.textContent !== '' && this.currentMovement === 3) {
                    this.clearCommentaryTyping(); this.historicalCommentary.classList.remove('visible');
                }
                if (elapsed >= t.movement3End - 2 && elapsed < t.movement3End) { this.videoLayers[3].classList.add('fading'); this.fadeVideoAudio(3, 0, 2); }
                if (elapsed >= 75 && elapsed < 78) this.videoLayers[3].classList.add('chromatic');
                else this.videoLayers[3].classList.remove('chromatic');
                if (elapsed >= t.movement3End - 4 && this.musicLayer4 && this.musicLayer4.paused) {
                    this.musicLayer4.volume = 0; this.musicLayer4.play().catch(() => {}); this.fadeAudioGain('music4', 0, 0.3, 4);
                }
            }

            /* ── movement 4 ── */
            if (this.currentMovement === 4) {
                if (elapsed >= t.movement4SplitReveal) this.splitScreenOverlay.classList.add('active');
                if (elapsed >= t.movement4Bar1In) this.barGroup1.classList.add('visible');
                if (elapsed >= t.movement4Bar2In) this.barGroup2.classList.add('visible');
                if (elapsed >= t.movement4Bar3In) this.barGroup3.classList.add('visible');
                if (elapsed >= t.movement4QuoteIn && elapsed < t.movement4QuoteOut) this.quoteM4.classList.add('visible');
                else this.quoteM4.classList.remove('visible');
                if (elapsed >= t.movement4PosterIn && elapsed < t.movement4End) this.overlayElectionPoster.classList.add('visible');
                else this.overlayElectionPoster.classList.remove('visible');
                if (elapsed >= t.movement4DateStampIn && elapsed < t.movement4End) this.dateStamp4.classList.add('visible');
                else this.dateStamp4.classList.remove('visible');
                if (elapsed >= t.newsTickerIn && elapsed < t.movement4End) this.newsTicker.classList.add('visible');
                else this.newsTicker.classList.remove('visible');
                if (elapsed >= t.movement4CommentaryIn && elapsed < t.movement4CommentaryOut && !this.commentaryTypingTimer && this.commentaryText.textContent === '')
                    this.typeCommentary(4);
                else if ((elapsed < t.movement4CommentaryIn || elapsed >= t.movement4CommentaryOut) && this.commentaryText.textContent !== '' && this.currentMovement === 4) {
                    this.clearCommentaryTyping(); this.historicalCommentary.classList.remove('visible');
                }
                if (elapsed >= t.movement4End - 2 && elapsed < t.movement4End) { this.videoLayers[4].classList.add('fading'); this.fadeVideoAudio(4, 0, 2); }
            }

            if (elapsed >= t.endFreeze && !this.endStateReached) this.triggerEndState();
            if (elapsed >= t.endComplete) { this.finishSymphony(); return; }
            this.animationFrameId = requestAnimationFrame(() => this.runTimeline());
        }

        enterMovement(num) {
            Object.values(this.videoLayers).forEach(l => l.classList.remove('active', 'fading', 'chromatic'));
            if (this.videoLayers[num]) {
                this.videoLayers[num].classList.add('active');
                if (this.videos[num] && this.videos[num].paused) this.videos[num].play().catch(() => {});
            }
            if (num !== 4) {
                this.splitScreenOverlay.classList.remove('active');
                this.barGroup1.classList.remove('visible');
                this.barGroup2.classList.remove('visible');
                this.barGroup3.classList.remove('visible');
                this.newsTicker.classList.remove('visible');
            }
            if (num !== 1) {
                this.overlayIronCross.classList.remove('visible');
                this.overlayStarvingChild.classList.remove('visible');
                this.inflationCounter.classList.remove('visible');
                this.inflationCounter.classList.remove('bloody-active');
                this.inflationLastFrameIndex = -1;
                this.dateStamp1.classList.remove('visible');
                if (this.inflationAnimationId) { cancelAnimationFrame(this.inflationAnimationId); this.inflationAnimationId = null; }
            }
            if (num !== 2) this.dateStamp2.classList.remove('visible');
            if (num !== 3) { this.overlayPutschMedal.classList.remove('visible'); this.dateStamp3.classList.remove('visible'); }
            if (num !== 4) { this.overlayElectionPoster.classList.remove('visible'); this.dateStamp4.classList.remove('visible'); }
            [this.quoteM1, this.quoteM2, this.quoteM3, this.quoteM4].forEach(q => q.classList.remove('visible'));
            this.clearCommentaryTyping();
            this.historicalCommentary.classList.remove('visible');
            if (this.videoLayers[num]) {
                this.videoLayers[num].classList.add('chromatic');
                setTimeout(() => this.videoLayers[num].classList.remove('chromatic'), 350);
            }
            this.triggerLightLeak();
            this.handleMusicTransition(num);
            this.currentMovement = num;
            this.proceduralCanvas.style.opacity = this.videoErrorCount[num] >= 1 ? '0.7' : '0.35';
            console.log(`Entered Movement ${num} at ${this.getElapsed().toFixed(1)}s`);
        }

        handleMusicTransition(num) {
            if (num === 2) {
                this.fadeAudioGain('music1', 0.35, 0, 2);
                if (this.musicLayer2) { this.musicLayer2.volume = 0; this.musicLayer2.play().catch(() => {}); this.fadeAudioGain('music2', 0, 0.3, 2.5); }
            }
            if (num === 3) {
                this.fadeAudioGain('music2', 0.3, 0, 2);
                if (this.musicLayer3) { this.musicLayer3.volume = 0; this.musicLayer3.play().catch(() => {}); this.fadeAudioGain('music3', 0, 0.28, 3); }
            }
            if (num === 4) {
                this.fadeAudioGain('music3', 0.28, 0, 3);
                if (this.musicLayer4) { this.musicLayer4.volume = 0; this.musicLayer4.play().catch(() => {}); this.fadeAudioGain('music4', 0, 0.3, 4); }
            }
        }

        fadeVideoAudio(vnum, tg, dur) {
            const key = 'video' + vnum;
            if (this.gainNodes[key] && this.audioContext) {
                const g  = this.gainNodes[key];
                const sv = g.gain.value;
                const st = this.audioContext.currentTime;
                g.gain.setValueAtTime(sv, st);
                g.gain.linearRampToValueAtTime(tg, st + dur);
            }
            if (this.videos[vnum]) {
                const vol = this.videos[vnum].volume;
                const steps = 20;
                const iv  = (dur * 1000) / steps;
                const dec = vol / steps;
                let step = 0;
                const fi = setInterval(() => {
                    step++;
                    if (this.videos[vnum]) this.videos[vnum].volume = Math.max(0, vol - dec * step);
                    if (step >= steps) clearInterval(fi);
                }, iv);
            }
        }

        fadeAudioGain(key, fv, tv, dur) {
            if (!this.audioContext || !this.gainNodes[key]) return;
            const g  = this.gainNodes[key];
            const st = this.audioContext.currentTime;
            g.gain.setValueAtTime(fv, st);
            g.gain.linearRampToValueAtTime(tv, st + dur);
        }

        /* ══════════════════════════════════════════════════════
           END STATE
           ══════════════════════════════════════════════════════ */
        triggerEndState() {
            this.endStateReached = true;
            this.clearCommentaryTyping();
            this.historicalCommentary.classList.remove('visible');
            this.lightLeakTimers.forEach(t => clearTimeout(t));
            this.lightLeakTimers = [];
            if (this.inflationAnimationId) { cancelAnimationFrame(this.inflationAnimationId); this.inflationAnimationId = null; }
            Object.values(this.videos).forEach(v => v.pause());
            if (this.video4split) this.video4split.pause();
            Object.values(this.videoLayers).forEach(l => l.classList.remove('active', 'fading', 'chromatic'));
            this.splitScreenOverlay.classList.remove('active');
            this.newsTicker.classList.remove('visible');
            this.inflationCounter.classList.remove('visible');
            this.inflationCounter.classList.remove('bloody-active');
            this.letterboxTop.classList.remove('cinematic');
            this.letterboxBottom.classList.remove('cinematic');
            this.letterboxTop.classList.add('full-black');
            this.letterboxBottom.classList.add('full-black');
            if (this.telephoneRing) {
                this.telephoneRing.volume = 0.5;
                this.telephoneRing.play().catch(() => {});
                if (this.gainNodes['telephone'] && this.audioContext) {
                    const g = this.gainNodes['telephone'];
                    const now = this.audioContext.currentTime;
                    g.gain.setValueAtTime(0.5, now);
                    g.gain.linearRampToValueAtTime(0, now + 2.5);
                }
            }
            [this.musicLayer1, this.musicLayer2, this.musicLayer3, this.musicLayer4].forEach(el => {
                if (el) { el.pause(); el.volume = 0; }
            });
            Object.keys(this.gainNodes).forEach(k => {
                if (k.startsWith('music') && this.gainNodes[k] && this.audioContext) {
                    const g = this.gainNodes[k];
                    const now = this.audioContext.currentTime;
                    g.gain.setValueAtTime(g.gain.value, now);
                    g.gain.linearRampToValueAtTime(0, now + 0.3);
                }
            });
            this.endState.classList.add('visible');
            this.proceduralCanvas.style.opacity = '0.25';
            setTimeout(() => {
                this.letterboxTop.classList.remove('full-black');
                this.letterboxBottom.classList.remove('full-black');
            }, 3000);
            if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
        }

        finishSymphony() {
            if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
            this.isPlaying = false;
        }

        destroy() {
            this.clearCommentaryTyping();
            this.lightLeakTimers.forEach(t => clearTimeout(t));
            if (this.animationFrameId)    cancelAnimationFrame(this.animationFrameId);
            if (this.grainAnimId)         cancelAnimationFrame(this.grainAnimId);
            if (this.dustAnimId)          cancelAnimationFrame(this.dustAnimId);
            if (this.proceduralAnimId)    cancelAnimationFrame(this.proceduralAnimId);
            if (this.inflationAnimationId) cancelAnimationFrame(this.inflationAnimationId);
            if (this.audioContext) this.audioContext.close().catch(() => {});
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('click', this.handleClick);
            document.removeEventListener('touchstart', this.handleClick);
        }
    }

    /* ══════════════════════════════════════════════════════════
    BOOTSTRAP — try introduction.json, fall back to defaults
       ══════════════════════════════════════════════════════════ */
    function boot(data) {
        const symphony = new Symphony(data);
        window.__symphony = symphony;
        console.log('%c🎻 Symphony of Ruin %c— Complete Edition',
            'font-family:Cinzel,serif;font-size:1.3em;color:#cc0000;', 'color:#888;');
        console.log('%c1918–1928 · The Wound · Birth · Putsch · Lean Years',
            'font-family:Inter,sans-serif;font-size:0.8em;color:#666;');
        console.log('%cData source: introduction.json',
            'font-family:Inter,sans-serif;font-size:0.65em;color:#555;');
    }

    fetch('assets/introduction.json')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => boot(data))
        .catch(() => {
            console.warn('[Symphony] Could not load introduction.json — using built-in defaults. Serve via a local server for full functionality.');
            boot(Symphony.defaults());
        });

})();
