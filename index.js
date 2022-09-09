class SRTBVisualizer {
    static NoteColor = {
        BLUE: 0,
        RED: 1
    };
    
    static NoteType = {
        MATCH: 0,
        BEAT: 1,
        SPINRIGHT: 2,
        SPINLEFT: 3,
        HOLD: 4,
        HOLDPOINT: 5,
        TAP: 8,
        EXPERIMENTAL: 10,
        BEATRELEASE: 11,
        SCRATCH: 12
    };

    constructor(srtbContent, options) {
        this.srtbContent = srtbContent;
        this.setOptions(options ?? {});

        this.loadSRTB(srtbContent);
        this.initCanvas();

        if(this.options.controls) {
            this.controls = {
                container: null,
                scrollContainer: null,
                scrollBar: null,
                zoomContainer: null,
                zoomInButton: null,
                zoomOutButton: null,
                zoomLabel: null,
            };
        }
    }

    initCanvas() {
        let pixelRatio = window.devicePixelRatio;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width * pixelRatio;
        this.canvas.height = this.options.height * pixelRatio;
        this.canvas.style.width = this.options.width + 'px';
        this.canvas.style.height = this.options.height + 'px';
        this.canvas.style.overflow = 'hidden';
        this.canvas.style.backgroundColor = this.theme.backgroundColor;
        this.canvas.style.color = this.theme.textColor;
        this.canvas.style.borderColor = this.theme.lineColor;
        this.canvas.style.borderWidth = '1px';
        this.canvas.style.borderStyle = 'solid';

        this.canvasContext = this.canvas.getContext('2d');

        this.canvasContext.scale(pixelRatio, pixelRatio);
    }

    getElement() {
        let container = document.createElement('div');
        container.appendChild(this.canvas);

        if(this.options.controls) {
            this.controls.container = document.createElement('div');
            this.controls.container.style.display = 'grid';
            this.controls.container.style.gridTemplateColumns = '1fr auto';
            this.controls.container.style.gridGap = '15px';

            this.controls.scrollContainer = document.createElement('div');
            this.controls.scrollContainer.style.display = 'flex';
            this.controls.scrollContainer.style.alignItems = 'center';

            this.controls.scrollBar = document.createElement('input');
            this.controls.scrollBar.type = 'range';
            this.controls.scrollBar.min = 0;
            this.controls.scrollBar.max = this.srtb.currentTrackData.notes[this.srtb.currentTrackData.notes.length - 1].time;
            this.controls.scrollBar.value = 0;
            this.controls.scrollBar.style.width = '100%';
            this.controls.scrollBar.addEventListener('input', () => {
                this.options.offset = this.controls.scrollBar.value;
                this.render();
            });


            // ZOOM CONTROLS
            this.controls.zoomContainer = document.createElement('div');
            this.controls.zoomContainer.style.display = 'flex';
            this.controls.zoomContainer.style.flexDirection = 'row';
            this.controls.zoomContainer.style.alignItems = 'center';

            this.controls.zoomInButton = document.createElement('button');
            this.controls.zoomInButton.innerText = '+';
            this.controls.zoomInButton.style.padding = "10px 20px";
            this.controls.zoomInButton.addEventListener('click', () => {
                this.options.zoom += 0.5;
                this.render();
            });

            this.controls.zoomOutButton = document.createElement('button');
            this.controls.zoomOutButton.innerText = '-';
            this.controls.zoomOutButton.style.padding = "10px 20px";
            this.controls.zoomOutButton.addEventListener('click', () => {
                if(this.options.zoom > 0.5) {
                    this.options.zoom -= 0.5;
                    this.render();
                }
            });

            this.controls.zoomLabel = document.createElement('div');
            this.controls.zoomLabel.style.padding = "0px 20px";

            this.controls.scrollContainer.appendChild(this.controls.scrollBar);

            this.controls.zoomContainer.appendChild(this.controls.zoomInButton);
            this.controls.zoomContainer.appendChild(this.controls.zoomLabel);
            this.controls.zoomContainer.appendChild(this.controls.zoomOutButton);

            this.controls.container.appendChild(this.controls.scrollContainer);
            this.controls.container.appendChild(this.controls.zoomContainer);

            this.renderControls();

            container.appendChild(this.controls.container);
        }

        return container;
    }

    render() {
        // Clear canvas
        this.canvasContext.clearRect(0, 0, this.options.width, this.options.height);

        // Redraw
        this.renderTitleBar();
        this.renderBars();
        this.renderNotes();
        this.renderFooterBar();
        
        if(this.options.controls) {
            this.renderControls();
        }
    }

    renderTitleBar() {
        // Title
        this.canvasContext.font = '16px sans-serif';
        this.canvasContext.fillStyle = this.theme.textColor;
        this.canvasContext.textAlign = 'left';
        this.canvasContext.fillText(this.srtb.trackInfo.title, 10, 25);

        // Artist
        this.canvasContext.font = '12px sans-serif';
        this.canvasContext.fillStyle = this.theme.secondaryTextColor;
        this.canvasContext.textAlign = 'left';
        this.canvasContext.fillText(this.srtb.trackInfo.artistName, 10, 45);

        // Difficulties
        this.canvasContext.font = '16px sans-serif';
        this.canvasContext.fillStyle = this.theme.textColor;
        this.canvasContext.textAlign = 'right';

        if(this.srtb.difficultyXD) {
            this.canvasContext.fillStyle = this.theme.textColor;
            this.canvasContext.fillText("XD", this.options.width - 30, 25);
            this.canvasContext.fillStyle = this.theme.secondaryTextColor;
            this.canvasContext.fillText(this.srtb.difficultyXD, this.options.width - 10, 25);
        }
        if(this.srtb.difficultyExpert) {
            this.canvasContext.fillStyle = this.theme.textColor;
            this.canvasContext.fillText("EX", this.options.width - 90, 25);
            this.canvasContext.fillStyle = this.theme.secondaryTextColor;
            this.canvasContext.fillText(this.srtb.difficultyExpert, this.options.width - 70, 25);
        }
        if(this.srtb.difficultyHard) {
            this.canvasContext.fillStyle = this.theme.textColor;
            this.canvasContext.fillText("H", this.options.width - 150, 25);
            this.canvasContext.fillStyle = this.theme.secondaryTextColor;
            this.canvasContext.fillText(this.srtb.difficultyHard, this.options.width - 130, 25);
        }
        if(this.srtb.difficultyNormal) {
            this.canvasContext.fillStyle = this.theme.textColor;
            this.canvasContext.fillText("N", this.options.width - 205, 25);
            this.canvasContext.fillStyle = this.theme.secondaryTextColor;
            this.canvasContext.fillText(this.srtb.difficultyNormal, this.options.width - 190, 25);
        }
        if(this.srtb.difficultyEasy) {
            this.canvasContext.fillStyle = this.theme.textColor;
            this.canvasContext.fillText("E", this.options.width - 265, 25);
            this.canvasContext.fillStyle = this.theme.secondaryTextColor;
            this.canvasContext.fillText(this.srtb.difficultyEasy, this.options.width - 250, 25);
        }

        // Charter
        this.canvasContext.font = '12px sans-serif';
        this.canvasContext.fillStyle = this.theme.secondaryTextColor;
        this.canvasContext.textAlign = 'right';
        this.canvasContext.fillText("Charted by " + this.srtb.trackInfo.charter, this.options.width - 10, 45);

        // Divider
        this.drawLine(0, 60, this.options.width, 60, this.theme.lineColor);
    }

    renderFooterBar() {
        // Divider
        this.drawLine(0, this.options.height - 30, this.options.width, this.options.height - 30, this.theme.lineColor);

        // Difficulty
        this.canvasContext.font = '12px sans-serif';
        this.canvasContext.fillStyle = this.theme.textColor;
        this.canvasContext.textAlign = 'left';
        this.canvasContext.fillText("Difficulty: " + this.options.difficulty, 10, this.options.height - 10);

        // Notes Count
        this.canvasContext.font = '12px sans-serif';
        this.canvasContext.fillStyle = this.theme.textColor;
        this.canvasContext.textAlign = 'left';
        this.canvasContext.fillText("Notes: " + this.srtb.currentTrackData.notes.length, 100, this.options.height - 10);
    }

    renderControls() {
        this.controls.zoomLabel.innerText = 'Zoom: ' + this.options.zoom * 100 + '%';
    }

    renderBars() {
        for(let i = 1; (i * 40 * this.options.zoom) < this.options.width; i++) {
            this.drawLine((i * 40 * this.options.zoom) - this.options.offset, 60, (i * 40 * this.options.zoom) - this.options.offset + 1, this.options.height - 30, this.theme.lineColor);
        }
    }

    renderNotes() {
        console.log("Rendering difficulty: " + this.options.difficulty);

        this.srtb.currentTrackData.notes.forEach(note => {
            switch(note.type) {
                default:
                    break;
                case SRTBVisualizer.NoteType.BEAT:
                    this.drawBeatNote(note.time);
                    break;
                case SRTBVisualizer.NoteType.MATCH:
                    this.drawMatchNote(note.time, note.column, note.colorIndex);
                    break;
                case SRTBVisualizer.NoteType.SPINRIGHT:
                    break;
                case SRTBVisualizer.NoteType.SPINLEFT:
                    break;
                case SRTBVisualizer.NoteType.HOLD:
                    break;
                case SRTBVisualizer.NoteType.HOLDPOINT:
                    break;
                case SRTBVisualizer.NoteType.TAP:
                    this.drawTapNote(note.time, note.column, note.colorIndex);
                    break;
                case SRTBVisualizer.NoteType.EXPERIMENTAL:
                    break;
                case SRTBVisualizer.NoteType.BEATRELEASE:
                    break;
                case SRTBVisualizer.NoteType.SCRATCH:
                    break;

            }
        });
    }

    drawLine(x, y, x2, y2, color) {
        this.canvasContext.strokeStyle = color;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(x, y);
        this.canvasContext.lineTo(x2, y2);
        this.canvasContext.stroke();
    }

    drawMatchNote(time, lane, colorIndex) {
        this.canvasContext.fillStyle = SRTBVisualizer.getNoteColor(colorIndex);
        this.canvasContext.fillRect(((time - this.options.offset) * 40 * this.options.zoom) - 5, 180 + lane * 30 + 5, 10, 10);
    }

    drawBeatNote(time) {
        this.canvasContext.fillStyle = 'lightgreen';
        this.canvasContext.fillRect(((time - this.options.offset) * 40 * this.options.zoom) - 1, 90, 2, 200);
    }

    drawTapNote(time, lane, colorIndex) {
        this.canvasContext.fillStyle = SRTBVisualizer.getNoteColor(colorIndex);
        this.canvasContext.fillRect(((time - this.options.offset) * 40 * this.options.zoom) - 10, 180 + lane * 30, 20, 20);
    }

    setOptions(options) {
        this.options = {
            width: options.width ?? 900,
            height: options.height ?? 350,
            theme: options.theme ?? 'light',
            difficulty: options.difficulty ?? RatingDifficulty.EASY,
            zoom: options.zoom ?? 1,
            offset: options.offset ?? 0,
            controls: options.controls ?? false,
        };

        this.theme = this.getTheme(this.options.theme);
    }
    
    getTheme(theme) {
        switch(theme) {
            default:
            case 'light':
                return {
                    backgroundColor: '#eee',
                    textColor: '#333',
                    secondaryTextColor: '#666',
                    lineColor: '#ccc',
                };
            case 'dark':
                return {
                    backgroundColor: '#222',
                    textColor: '#eee',
                    secondaryTextColor: '#ccc',
                    lineColor: '#ccc',
                };
        }
    }

    loadSRTB(json) {
        this.srtb = {
            trackInfo: null,
            trackData: [],
            clipInfo: [],
            currentTrackData: {},
            difficultyEasy: false,
            difficultyNormal: false,
            difficultyHard: false,
            difficultyExpert: false,
            difficultyXD: false,
        };

        json.unityObjectValuesContainer.values.forEach(objectValueContainer => {
            if(objectValueContainer.fullType === 'TrackInfo') {
                this.srtb.trackInfo = this.loadValues(objectValueContainer.jsonKey);
            }
            if(objectValueContainer.fullType === 'TrackData') {
                let trackData = this.loadValues(objectValueContainer.jsonKey);
                trackData.clipInfo = this.loadValues("SO_ClipInfo_" + trackData.clipInfoAssetReferences[0].assetName);
                this.srtb.trackData.push(trackData);

                switch(trackData.difficultyType) {
                    case RatingDifficulty.EASY:
                        this.srtb.difficultyEasy = trackData.difficultyRating;
                        break;
                    case RatingDifficulty.NORMAL:
                        this.srtb.difficultyNormal = trackData.difficultyRating;
                        break;
                    case RatingDifficulty.HARD:
                        this.srtb.difficultyHard = trackData.difficultyRating;
                        break;
                    case RatingDifficulty.EXPERT:
                        this.srtb.difficultyExpert = trackData.difficultyRating;
                        break;
                    case RatingDifficulty.XD:
                        this.srtb.difficultyXD = trackData.difficultyRating;
                        break;
                }
            }
            if(objectValueContainer.fullType === 'ClipInfo') {
                let clipInfo = this.loadValues(objectValueContainer.jsonKey);

                this.srtb.clipInfo.push(clipInfo);
            }
        });

        this.srtb.currentTrackData = this.srtb.trackData.find(trackData => trackData.difficultyType === this.options.difficulty);

        console.log(this.srtb);
    }

    loadValues(jsonKey) {
        const valueContainer = this.srtbContent.largeStringValuesContainer.values.find(valueContainer => valueContainer.key === jsonKey);
        return JSON.parse(valueContainer.val);
    }

    static getNoteColor(noteColor) {
        switch(noteColor) {
            case SRTBVisualizer.NoteColor.BLUE:
                return 'dodgerblue';
            case SRTBVisualizer.NoteColor.RED:
                return 'crimson';
        }
    }
}

const RatingDifficulty = {
    EASY: 2,
    NORMAL: 3,
    HARD: 4,
    EXPERT: 5,
    XD: 6,
};