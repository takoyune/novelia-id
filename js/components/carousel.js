import { router } from '../router.js';

export class Carousel {
    constructor(containerId, items) {
        this.container = document.getElementById(containerId);
        this.items = items;
        this.currentIndex = 0;
        this.interval = null;
        this.touchStartX = 0;
        
        if (this.container && this.items.length > 0) {
            this.render();
            this.initEvents();
            this.startAutoPlay();
        }
    }

    render() {
        let slidesHtml = '';
        let dotsHtml = '';

        this.items.forEach((item, index) => {
            // Trim synopsis for slide
            const shortSynopsis = item.synopsis.length > 150 ? item.synopsis.substring(0, 147) + '...' : item.synopsis;

            slidesHtml += `
                <div class="carousel-slide" data-index="${index}">
                    <div class="slide-bg" style="background-image: url('${item.cover}')"></div>
                    <div class="container slide-content">
                        <img src="${item.cover}" alt="Cover" class="slide-cover">
                        <div class="slide-info">
                            <h2>${item.title}</h2>
                            <p>${shortSynopsis}</p>
                            <a href="#/novel/${item.id}" class="btn btn-primary">
                                <i class="fas fa-book-reader"></i> Read Now
                            </a>
                        </div>
                    </div>
                </div>
            `;

            dotsHtml += `<div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
        });

        this.container.innerHTML = `
            <div class="carousel-track" id="carousel-track">
                ${slidesHtml}
            </div>
            <button class="carousel-btn carousel-prev" aria-label="Previous slide"><i class="fas fa-chevron-left"></i></button>
            <button class="carousel-btn carousel-next" aria-label="Next slide"><i class="fas fa-chevron-right"></i></button>
            <div class="carousel-dots">${dotsHtml}</div>
        `;

        this.track = this.container.querySelector('.carousel-track');
        this.dots = this.container.querySelectorAll('.dot');
    }

    initEvents() {
        const prevBtn = this.container.querySelector('.carousel-prev');
        const nextBtn = this.container.querySelector('.carousel-next');

        prevBtn.addEventListener('click', () => this.goToSlide(this.currentIndex - 1));
        nextBtn.addEventListener('click', () => this.goToSlide(this.currentIndex + 1));

        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.goToSlide(index);
            });
        });

        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());

        // Swipe support
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.stopAutoPlay();
        }, {passive: true});

        this.container.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (this.touchStartX - touchEndX > 50) {
                this.goToSlide(this.currentIndex + 1); // Swipe left
            } else if (this.touchStartX - touchEndX < -50) {
                this.goToSlide(this.currentIndex - 1); // Swipe right
            }
            this.startAutoPlay();
        }, {passive: true});
    }

    goToSlide(index) {
        if (index < 0) {
            this.currentIndex = this.items.length - 1;
        } else if (index >= this.items.length) {
            this.currentIndex = 0;
        } else {
            this.currentIndex = index;
        }

        const offset = -100 * this.currentIndex;
        this.track.style.transform = `translateX(${offset}%)`;

        // Update dots
        this.dots.forEach(dot => dot.classList.remove('active'));
        this.dots[this.currentIndex].classList.add('active');
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.interval = setInterval(() => {
            this.goToSlide(this.currentIndex + 1);
        }, 5000);
    }

    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    destroy() {
        this.stopAutoPlay();
        // Remove event listeners by replacing node
        if (this.container) {
             const clone = this.container.cloneNode(false);
             this.container.parentNode.replaceChild(clone, this.container);
        }
    }
}
