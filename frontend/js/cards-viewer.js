// cards-viewer.js

class CardsViewer {
    constructor() {
        this.cards = [];
        this.currentIndex = 0;
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'multimodal-overlay';
        
        this.overlay.innerHTML = `
            <div class="multimodal-content">
                <button class="multimodal-close">&times;</button>
                <div class="multimodal-counter"><span id="mm-current">1</span> / <span id="mm-total">1</span></div>
                <button class="multimodal-prev">&#10094;</button>
                <img class="multimodal-image" src="" alt="Carta">
                <button class="multimodal-next">&#10095;</button>
                <div class="multimodal-info" id="mm-info">Nome da Regra</div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);

        this.closeBtn = this.overlay.querySelector('.multimodal-close');
        this.prevBtn = this.overlay.querySelector('.multimodal-prev');
        this.nextBtn = this.overlay.querySelector('.multimodal-next');
        this.imgEl = this.overlay.querySelector('.multimodal-image');
        this.infoEl = this.overlay.querySelector('#mm-info');
        this.currentEl = this.overlay.querySelector('#mm-current');
        this.totalEl = this.overlay.querySelector('#mm-total');
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
        this.nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });
        
        // Swipe and Keyboard support can be added here
        document.addEventListener('keydown', (e) => {
            if (!this.overlay.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Touch swipe support variables
        let touchstartX = 0;
        let touchendX = 0;
        
        this.overlay.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        });

        this.overlay.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        const handleSwipe = () => {
            if (touchendX < touchstartX - 50) this.next();
            if (touchendX > touchstartX + 50) this.prev();
        }
    }

    open(cards, startIndex = 0) {
        if (!cards || cards.length === 0) return;
        this.cards = cards;
        this.currentIndex = startIndex;
        this.totalEl.textContent = this.cards.length;
        
        this.updateView();
        
        if (this.cards.length <= 1) {
            this.prevBtn.style.display = 'none';
            this.nextBtn.style.display = 'none';
            this.currentEl.parentElement.style.display = 'none';
        } else {
            this.prevBtn.style.display = 'flex';
            this.nextBtn.style.display = 'flex';
            this.currentEl.parentElement.style.display = 'block';
        }

        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    updateView() {
        const card = this.cards[this.currentIndex];
        this.imgEl.src = card.image_path || card.image;
        this.infoEl.textContent = card.name || card.title;
        this.currentEl.textContent = this.currentIndex + 1;
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        this.updateView();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        this.updateView();
    }
}

// Global instance
window.cardsViewer = new CardsViewer();
