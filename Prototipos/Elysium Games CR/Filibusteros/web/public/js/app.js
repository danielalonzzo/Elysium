class GameState {
    constructor() {
        this.data = this.load() || {
            maxSlideIndex: 0,
            inventory: []
        };
    }
    
    save(index, inventoryItems) {
        if (index > this.data.maxSlideIndex) {
            this.data.maxSlideIndex = index;
        }
        this.data.inventory = inventoryItems;
        localStorage.setItem('filibusteros_state', JSON.stringify(this.data));
    }
    
    load() {
        const saved = localStorage.getItem('filibusteros_state');
        return saved ? JSON.parse(saved) : null;
    }

    clear() {
        localStorage.removeItem('filibusteros_state');
        this.data = { maxSlideIndex: 0, inventory: [] };
    }
}

class Inventory {
    constructor(initialItems = []) {
        this.items = initialItems;
        this.ui = document.getElementById('inventory-ui');
        if(this.items.length > 0) this.render();
    }

    addItem(icon, name) {
        if (!this.items.includes(name)) {
            this.items.push(name);
            this.render();
            return true;
        }
        return false;
    }

    render() {
        this.ui.innerHTML = '';
        if (this.items.length > 0) {
            this.ui.classList.remove('hidden');
            this.items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'inventory-item';
                el.innerHTML = `<span>🗝️</span> ${item}`;
                if (item.includes("Medalla")) el.innerHTML = `<span>🎖️</span> ${item}`;
                if (item.includes("Dato")) el.innerHTML = `<span>📜</span> ${item}`;
                this.ui.appendChild(el);
            });
        }
    }
}

class StoryEngine {
    constructor() {
        this.backgroundLayer = document.getElementById('background-layer');
        this.chapterTitle = document.getElementById('chapter-title');
        this.levelIndicator = document.getElementById('level-indicator');
        this.dialogueText = document.getElementById('dialogue-text');
        this.continueBtn = document.getElementById('continue-btn');
        this.backBtn = document.getElementById('back-btn');
        this.loadingScreen = document.getElementById('loading-screen');
        this.minigameContainer = document.getElementById('minigame-container');
        
        this.state = new GameState();
        this.inventory = new Inventory(this.state.data.inventory);
        this.currentSlideIndex = this.state.data.maxSlideIndex;
        
        this.isTyping = false;
        this.typewriterInterval = null;
        
        // Diccionario del Glosario Ampliado
        this.glossary = {
            "republica_federal": {
                title: "República Federal de Centroamérica",
                text: "La República Federal de Centroamérica (1824-1839) fue una federación que unió a Guatemala, El Salvador, Honduras, Nicaragua y Costa Rica tras la independencia de España. Su colapso dejó a la región dividida en repúblicas independientes pero vulnerables política y económicamente."
            },
            "destino_manifiesto": {
                title: "Destino Manifiesto",
                text: "Creencia del siglo XIX de que Estados Unidos estaba destinado por designio divino a expandirse por todo el continente americano. Esta doctrina sirvió para justificar anexiones e intervenciones filibusteras en territorios extranjeros, como México y Centroamérica."
            },
            "esclavizar_istmo": {
                title: "Esclavitud en el Istmo",
                text: "Un istmo es una franja estrecha de tierra que une dos masas terrestres mayores (en este caso, Norte y Sur América). William Walker, tras usurpar el poder, emitió un decreto en 1856 revocando la abolición de la esclavitud en Nicaragua (abolida desde 1824) con el objetivo de congraciarse con los estados sureños de EE. UU. e instaurar un imperio esclavista."
            },
            "terror_nicaragua": {
                title: "El Régimen del Terror",
                text: "Walker instauró un régimen autoritario apoyado por mercenarios. Fusiló a opositores, destruyó ciudades enteras (como la quema de Granada) y revirtió leyes fundamentales para instaurar el inglés como idioma oficial y legalizar la esclavitud, aterrorizando a la población civil."
            },
            "mora_porras": {
                title: "Juan Rafael Mora Porras",
                image: "assets/images/mora_porras.png",
                text: "Conocido como 'Don Juanito', fue el Presidente de Costa Rica que lideró la Campaña Nacional de 1856-1857. Su visión estratégica y liderazgo fueron cruciales para unir al pueblo costarricense y a las repúblicas centroamericanas contra la amenaza filibustera."
            },
            "tropas_cr": {
                title: "El Ejército Expedicionario",
                image: "assets/images/tropas_1856.png",
                text: "Las tropas costarricenses estaban compuestas en su mayoría por campesinos, artesanos y milicianos civiles armados con rifles Minié y mucha valentía. A pesar de su origen humilde, demostraron un coraje inquebrantable para defender su soberanía."
            },
            "santa_rosa": {
                title: "Hacienda Santa Rosa",
                text: "Ubicada en Guanacaste, muy cerca de la frontera norte de Costa Rica. Fue el escenario de la primera gran victoria el 20 de marzo de 1856. Walker subestimó a los costarricenses enviando un batallón que fue derrotado sorpresivamente en tan solo 14 minutos."
            }
        };
        
        // Secuencia Capítulo 1 - Ajustada a Español de Costa Rica (Ustedeo)
        this.storySequence = [
            { type: 'text', level: 1, bgImage: 'assets/images/mapa_1856.png', text: "1821 - 1842. Tras la independencia, la región centroamericana se sume en la inestabilidad. La <span class='glossary-term' data-term='republica_federal'>República Federal</span> colapsa, dejando a las naciones hermanas divididas y vulnerables." },
            { type: 'text', level: 2, bgImage: 'assets/images/mapa_1856.png', text: "Mientras tanto, en el norte, los sureños esclavistas de Estados Unidos buscan expandirse bajo la doctrina del '<span class='glossary-term' data-term='destino_manifiesto'>Destino Manifiesto</span>'. Su mirada se posa sobre la ruta transoceánica en Centroamérica." },
            { type: 'text', level: 3, bgImage: 'assets/images/contrato_walker.png', text: "El conflicto estalla en Nicaragua. En un acto de desesperación, la facción liberal de León toma una decisión fatídica en 1855..." },
            { type: 'text', level: 4, bgImage: 'assets/images/contrato_walker.png', text: "Firman un contrato con William Walker, un filibustero estadounidense, abriendo las puertas a una invasión mercenaria que amenaza con <span class='glossary-term' data-term='esclavizar_istmo'>esclavizar todo el istmo</span>." },
            { type: 'minigame', level: 5, action: 'startLevel5' },
            { type: 'text', level: 6, bgImage: 'assets/images/mapa_1856.png', text: "Tras asegurar su presencia, Walker impone un <span class='glossary-term' data-term='terror_nicaragua'>régimen de terror en Nicaragua</span>. La noticia llega a Costa Rica, despertando alarmas en el gobierno." },
            { type: 'text', level: 7, bgImage: 'assets/images/mapa_1856.png', text: "El Presidente <span class='glossary-term' data-term='mora_porras'>Juan Rafael Mora Porras</span> comprende la gravedad de la amenaza. Necesita pruebas sólidas para justificar la movilización militar ante el Congreso." },
            { type: 'minigame', level: 8, action: 'startLevel8' },
            { type: 'text', level: 9, bgImage: 'assets/images/contrato_walker.png', text: "Con el contrato original en nuestras manos, las intenciones de Walker son innegables. Las <span class='glossary-term' data-term='tropas_cr'>tropas costarricenses</span> comienzan a marchar hacia la frontera norte." },
            { type: 'text', level: 10, bgImage: 'assets/images/mapa_1856.png', text: "El escenario está listo. El ejército expedicionario se acerca a <span class='glossary-term' data-term='santa_rosa'>Santa Rosa</span>. El destino de la libertad de Centroamérica pende de un hilo." },
            { type: 'chapter_end', level: 10, action: 'endChapter1' }
        ];

        this.init();
    }

    init() {
        this.setupGlossaryModal();
        this.setupAlertModal();
        this.setupDocumentModal();
        
        setTimeout(() => {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.classList.add('hidden');
                
                const resetBtn = document.createElement('button');
                resetBtn.textContent = '⟳ Reiniciar Progreso';
                resetBtn.className = 'btn-reset';
                resetBtn.addEventListener('click', () => {
                    if (confirm('¿Está seguro de que desea reiniciar todo su progreso?')) {
                        this.state.clear();
                        location.reload();
                    }
                });
                document.body.appendChild(resetBtn);

                this.renderSlide();
            }, 1000);
        }, 1500);

        this.continueBtn.addEventListener('click', (e) => { e.stopPropagation(); this.nextSlide(); });
        this.backBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prevSlide(); });
        
        document.querySelector('.dialogue-box').addEventListener('click', (e) => {
            if(e.target.classList.contains('glossary-term')) return;
            
            if (this.isTyping) {
                this.completeTypingImmediately();
            } else if (!this.continueBtn.classList.contains('hidden')) {
                this.nextSlide();
            }
        });
    }

    setupGlossaryModal() {
        this.glossaryModal = document.getElementById('glossary-modal');
        this.glossaryTitle = document.getElementById('glossary-title');
        this.glossaryText = document.getElementById('glossary-text');
        this.glossaryImage = document.getElementById('glossary-image');
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.glossaryModal.classList.remove('visible');
        });
    }

    setupAlertModal() {
        this.alertModal = document.getElementById('alert-modal');
        this.alertText = document.getElementById('alert-text');
        this.alertCloseBtn = document.getElementById('alert-close-btn');
        
        this.alertCloseBtn.addEventListener('click', () => {
            this.alertModal.classList.remove('visible');
            if (this.alertCallback) {
                this.alertCallback();
                this.alertCallback = null;
            }
        });
    }

    setupDocumentModal() {
        this.documentModal = document.getElementById('document-modal');
        this.documentTitle = document.getElementById('document-title');
        this.documentImage = document.getElementById('document-image');
        this.documentText = document.getElementById('document-text');
        this.documentActionBtn = document.getElementById('document-action-btn');
        
        document.querySelector('.close-document-modal').addEventListener('click', () => {
            this.documentModal.classList.remove('visible');
        });

        this.documentActionBtn.addEventListener('click', () => {
            this.documentModal.classList.remove('visible');
            if (this.documentCallback) {
                this.documentCallback();
                this.documentCallback = null;
            }
        });
    }

    customAlert(message, callback = null) {
        this.alertText.textContent = message;
        this.alertCallback = callback;
        this.alertModal.classList.add('visible');
    }

    showDocument(title, imgSrc, text, btnText, callback = null) {
        this.documentTitle.textContent = title;
        this.documentImage.src = imgSrc;
        this.documentText.textContent = text;
        this.documentActionBtn.textContent = btnText;
        this.documentCallback = callback;
        this.documentModal.classList.add('visible');
    }

    openGlossary(termKey) {
        const data = this.glossary[termKey];
        if(data) {
            this.glossaryTitle.textContent = data.title;
            this.glossaryText.textContent = data.text;
            if(data.image) {
                this.glossaryImage.src = data.image;
                this.glossaryImage.style.display = 'block';
            } else {
                this.glossaryImage.style.display = 'none';
            }
            this.glossaryModal.classList.add('visible');
        }
    }

    renderSlide() {
        this.state.save(this.currentSlideIndex, this.inventory.items);

        if (this.currentSlideIndex >= this.storySequence.length) return;

        const slide = this.storySequence[this.currentSlideIndex];
        this.levelIndicator.textContent = `Nivel ${slide.level}`;
        
        if (this.currentSlideIndex === 0) {
            this.backBtn.classList.add('hidden');
        } else {
            this.backBtn.classList.remove('hidden');
        }

        // Always clean up transparent mode unless specifically activated
        this.minigameContainer.classList.remove('transparent-mode');

        if (slide.type === 'text') {
            document.querySelector('.dialogue-box').classList.remove('hidden');
            this.minigameContainer.classList.add('hidden');

            if (this.backgroundLayer.style.backgroundImage !== `url("${slide.bgImage}")`) {
                this.backgroundLayer.style.opacity = '0';
                setTimeout(() => {
                    this.backgroundLayer.style.backgroundImage = `url("${slide.bgImage}")`;
                    this.backgroundLayer.style.opacity = '0.6';
                }, 1000);
            }

            this.continueBtn.classList.add('hidden');
            this.typeText(slide.text);
        } else if (slide.type === 'minigame') {
            this[slide.action]();
        } else if (slide.type === 'chapter_end') {
            this[slide.action]();
        }
    }

    typeText(fullTextHTML) {
        this.isTyping = true;
        this.dialogueText.innerHTML = '';
        this.continueBtn.classList.add('hidden');
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullTextHTML;
        
        let charsToType = [];
        tempDiv.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const chars = node.textContent.split('');
                chars.forEach(c => charsToType.push({ char: c, tag: null }));
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const chars = node.innerHTML.split('');
                const termKey = node.getAttribute('data-term');
                chars.forEach(c => charsToType.push({ char: c, tag: 'span', termKey: termKey }));
            }
        });

        this.dialogueText.innerHTML = '';
        let charIndex = 0;
        let currentSpanContext = null;
        let activeElement = this.dialogueText;

        clearInterval(this.typewriterInterval);
        this.typewriterInterval = setInterval(() => {
            if (charIndex < charsToType.length) {
                const item = charsToType[charIndex];
                
                if (item.tag && !currentSpanContext) {
                    currentSpanContext = document.createElement('span');
                    currentSpanContext.className = 'glossary-term';
                    currentSpanContext.setAttribute('data-term', item.termKey);
                    currentSpanContext.addEventListener('click', () => this.openGlossary(item.termKey));
                    this.dialogueText.appendChild(currentSpanContext);
                    activeElement = currentSpanContext;
                } else if (!item.tag && currentSpanContext) {
                    currentSpanContext = null;
                    activeElement = this.dialogueText;
                }
                
                activeElement.appendChild(document.createTextNode(item.char));
                charIndex++;
            } else {
                this.finishTyping();
            }
        }, 30);
    }

    completeTypingImmediately() {
        clearInterval(this.typewriterInterval);
        const slide = this.storySequence[this.currentSlideIndex];
        this.dialogueText.innerHTML = slide.text;
        
        this.dialogueText.querySelectorAll('.glossary-term').forEach(el => {
            el.addEventListener('click', () => this.openGlossary(el.getAttribute('data-term')));
        });
        
        this.finishTyping();
    }

    finishTyping() {
        this.isTyping = false;
        this.continueBtn.classList.remove('hidden');
    }

    nextSlide() {
        if (this.isTyping) return;
        
        const currentSlide = this.storySequence[this.currentSlideIndex];
        if(currentSlide.type === 'minigame') return; 

        if (this.currentSlideIndex < this.storySequence.length - 1) {
            this.currentSlideIndex++;
            this.renderSlide();
        }
    }

    prevSlide() {
        if (this.isTyping) return;
        if (this.currentSlideIndex > 0) {
            this.currentSlideIndex--;
            this.renderSlide();
        }
    }

    // --- Nivel 5: Rompecabezas Geopolítico ---
    startLevel5() {
        document.querySelector('.dialogue-box').classList.add('hidden');
        this.minigameContainer.classList.remove('hidden');
        
        if(this.state.data.maxSlideIndex > this.currentSlideIndex) {
            this.minigameContainer.innerHTML = `
                <h2 class="minigame-title">Rompecabezas Geopolítico (Completado)</h2>
                <p>Ya ha restaurado el orden de las fronteras.</p>
                <button id="skip-minigame-btn" class="action-btn">Continuar ▸</button>
            `;
            document.getElementById('skip-minigame-btn').addEventListener('click', () => {
                this.currentSlideIndex++;
                this.renderSlide();
            });
            return;
        }

        this.minigameContainer.innerHTML = `
            <h2 class="minigame-title">Rompecabezas Geopolítico</h2>
            <p style="margin-bottom: 20px;">Restaure el orden. Arrastre los países desde la reserva y colóquelos en orden geográfico (De norte a sur). Verá cómo se forma el mapa.</p>
            <div class="puzzle-area">
                <div class="puzzle-source" id="source-container">
                    <div class="country-piece" draggable="true" id="c_elsalvador">El Salvador</div>
                    <div class="country-piece" draggable="true" id="c_costarica">Costa Rica</div>
                    <div class="country-piece" draggable="true" id="c_guatemala">Guatemala</div>
                    <div class="country-piece" draggable="true" id="c_nicaragua">Nicaragua</div>
                    <div class="country-piece" draggable="true" id="c_honduras">Honduras</div>
                </div>
                
                <div class="central-map-area">
                    <svg id="central-america-svg" viewBox="0 0 300 400">
                        <!-- Mapa mejorado y encajado de Centroamérica -->
                        <path id="svg_c_guatemala" class="map-country" d="M 30,50 L 120,50 L 130,120 L 40,150 Z" />
                        <path id="svg_c_honduras" class="map-country" d="M 120,50 L 250,50 L 260,150 L 160,150 L 130,120 Z" />
                        <path id="svg_c_elsalvador" class="map-country" d="M 40,150 L 130,120 L 160,150 L 80,180 Z" />
                        <path id="svg_c_nicaragua" class="map-country" d="M 80,180 L 160,150 L 260,150 L 280,260 L 140,260 Z" />
                        <path id="svg_c_costarica" class="map-country" d="M 140,260 L 280,260 L 260,350 L 160,330 Z" />
                    </svg>
                </div>

                <div class="puzzle-target" id="target-container">
                    <div class="target-slot" data-expected="c_guatemala"><span class="slot-hint">Slot Norte (1)</span></div>
                    <div class="target-slot" data-expected="c_honduras"><span class="slot-hint">Slot (2)</span></div>
                    <div class="target-slot" data-expected="c_elsalvador"><span class="slot-hint">Slot (3)</span></div>
                    <div class="target-slot" data-expected="c_nicaragua"><span class="slot-hint">Slot (4)</span></div>
                    <div class="target-slot" data-expected="c_costarica"><span class="slot-hint">Slot Sur (5)</span></div>
                </div>
            </div>
            <button id="check-puzzle-btn" class="hidden action-btn">Verificar Orden</button>
        `;

        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const pieces = document.querySelectorAll('.country-piece');
        const slots = document.querySelectorAll('.target-slot');
        const source = document.getElementById('source-container');
        const checkBtn = document.getElementById('check-puzzle-btn');

        let draggedItem = null;

        pieces.forEach(p => {
            p.addEventListener('dragstart', function() {
                draggedItem = this;
                setTimeout(() => this.style.display = 'none', 0);
            });
            p.addEventListener('dragend', function() {
                setTimeout(() => {
                    draggedItem.style.display = 'flex';
                    draggedItem = null;
                    checkPuzzleComplete();
                    updateSvgMap();
                }, 0);
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', e => e.preventDefault());
            slot.addEventListener('dragenter', function(e) { e.preventDefault(); this.classList.add('drag-hover'); });
            slot.addEventListener('dragleave', function() { this.classList.remove('drag-hover'); });
            slot.addEventListener('drop', function() {
                this.classList.remove('drag-hover');
                const existingPiece = this.querySelector('.country-piece');
                if (!existingPiece) {
                    this.appendChild(draggedItem);
                } else {
                    source.appendChild(existingPiece);
                    this.appendChild(draggedItem);
                }
            });
        });

        source.addEventListener('dragover', e => e.preventDefault());
        source.addEventListener('drop', function() { this.appendChild(draggedItem); });

        const updateSvgMap = () => {
            document.querySelectorAll('.map-country').forEach(el => {
                el.classList.remove('active');
            });
            
            slots.forEach(slot => {
                const piece = slot.querySelector('.country-piece');
                if(piece) {
                    slot.classList.add('filled');
                    if(piece.id === slot.dataset.expected) {
                        const svgPath = document.getElementById('svg_' + piece.id);
                        if(svgPath) svgPath.classList.add('active');
                    }
                } else {
                    slot.classList.remove('filled');
                }
            });
        };

        const checkPuzzleComplete = () => {
            const filledSlots = document.querySelectorAll('.target-slot .country-piece');
            if (filledSlots.length === 5) {
                checkBtn.classList.remove('hidden');
            } else {
                checkBtn.classList.add('hidden');
            }
        };

        checkBtn.addEventListener('click', () => {
            let correct = true;
            slots.forEach(slot => {
                const piece = slot.querySelector('.country-piece');
                if(piece && piece.id !== slot.dataset.expected) {
                    correct = false;
                }
            });
            
            if(correct) {
                this.customAlert("¡Orden Geográfico Correcto! El mapa centroamericano brilla con unidad. Avance, por favor.", () => {
                    this.currentSlideIndex++;
                    this.renderSlide();
                });
            } else {
                this.customAlert("Orden incorrecto. Revise la geografía centroamericana e intente de nuevo. (Pista: Guatemala va al norte)");
            }
        });
    }

    // --- Nivel 8: Infiltración en León ---
    startLevel8() {
        document.querySelector('.dialogue-box').classList.add('hidden');
        this.minigameContainer.classList.remove('hidden');
        this.minigameContainer.classList.add('transparent-mode'); // Remover caja opaca para ver la oficina
        
        // Cambiar el fondo dinámicamente al despacho
        if (this.backgroundLayer.style.backgroundImage !== `url("assets/images/despacho_leon.png")`) {
            this.backgroundLayer.style.opacity = '0';
            setTimeout(() => {
                this.backgroundLayer.style.backgroundImage = `url("assets/images/despacho_leon.png")`;
                this.backgroundLayer.style.opacity = '0.9';
            }, 500);
        }
        
        if(this.state.data.maxSlideIndex > this.currentSlideIndex) {
            this.minigameContainer.innerHTML = `
                <h2 class="minigame-title">Infiltración en León (Completado)</h2>
                <p>Ya ha asegurado el documento probatorio.</p>
                <button id="skip-minigame-btn-8" class="action-btn">Continuar ▸</button>
            `;
            document.getElementById('skip-minigame-btn-8').addEventListener('click', () => {
                this.minigameContainer.classList.remove('transparent-mode');
                this.currentSlideIndex++;
                this.renderSlide();
            });
            return;
        }

        this.minigameContainer.innerHTML = `
            <h2 class="minigame-title">Infiltración en León (1855)</h2>
            <p>Busque en el despacho de la facción liberal. Debe encontrar el contrato firmado con Walker.</p>
            <p style="font-size:0.8em; opacity:0.9; color:var(--accent-gold);">(Pista: Hay un pergamino brillante cerca del centro del escritorio)</p>
            <div id="hidden-document"></div>
        `;

        document.getElementById('hidden-document').addEventListener('click', () => {
            this.showDocument(
                "Contrato con William Walker (1855)", 
                "assets/images/contrato_walker.png", 
                "Un documento original que confirma las oscuras intenciones del filibustero.", 
                "Recoger Prueba y Avanzar",
                () => {
                    if (this.inventory.addItem('document', 'Dato Clave: Contrato 1855')) {
                        this.state.save(this.currentSlideIndex, this.inventory.items);
                    }
                    this.minigameContainer.classList.remove('transparent-mode');
                    this.currentSlideIndex++;
                    this.renderSlide();
                }
            );
        });
    }

    endChapter1() {
        document.querySelector('.dialogue-box').classList.add('hidden');
        this.minigameContainer.classList.remove('hidden');
        
        this.inventory.addItem('medal', 'Medalla del Mensajero');
        this.inventory.addItem('key', 'Llave de la Capital');
        this.state.save(this.currentSlideIndex, this.inventory.items);

        this.minigameContainer.innerHTML = `
            <h2 class="minigame-title" style="color:var(--success-color)">¡Capítulo 1 Completado!</h2>
            <p>Ha recopilado información vital sobre la amenaza filibustera y asegurado el mapa de la región.</p>
            <p style="margin-top:20px;">Recompensas obtenidas:</p>
            <h3 style="color:var(--accent-gold)">🏅 Medalla del Mensajero</h3>
            <h3 style="color:var(--accent-gold)">🗝️ Llave de la Capital</h3>
            <br/>
            <p>[ Fin del Capítulo 1 ]</p>
            <p style="font-size: 0.8em; margin-top:20px;">Su progreso ha sido guardado localmente.</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new StoryEngine();
});
