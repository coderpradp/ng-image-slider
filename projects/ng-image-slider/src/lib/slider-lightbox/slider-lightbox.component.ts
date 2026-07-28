import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  DOCUMENT,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { SliderCustomImageComponent } from '../slider-custom-image/slider-custom-image.component';
import {
  ImageObject,
  SliderDirection,
  LightboxArrowAction,
} from '../ng-image-slider.models';

const LIGHTBOX_NEXT_ARROW_CLICK_MESSAGE: LightboxArrowAction = 'lightbox next',
  LIGHTBOX_PREV_ARROW_CLICK_MESSAGE: LightboxArrowAction = 'lightbox previous';

@Component({
  selector: 'lib-slider-lightbox',
  templateUrl: './slider-lightbox.component.html',
  imports: [CommonModule, SliderCustomImageComponent],
  host: {
    '(window:resize)': 'onResize()',
    '(document:keyup)': 'handleKeyboardEvent($event)',
  },
})
export class SliderLightboxComponent {
  private cdRef = inject(ChangeDetectorRef);
  private elRef = inject(ElementRef);
  private document = inject(DOCUMENT);

  totalImages = 0;
  popupWidth = 1200;
  marginLeft = 0;
  imageFullscreenView = false;
  lightboxPrevDisable = false;
  lightboxNextDisable = false;
  showLoading = false;
  effectStyle = 'none';
  speed = 1; // default speed in second
  title = '';
  currentImageIndex = 0;

  // for swipe event
  private swipeLightboxImgCoord?: [number, number];
  private swipeLightboxImgTime?: number;

  // @Inputs
  readonly images = input<ImageObject[]>([]);
  readonly imageIndex = input<number>();
  readonly show = input<boolean>(false);
  readonly videoAutoPlay = input<boolean>(false);
  readonly direction = input<SliderDirection>('ltr');
  readonly paginationShow = input<boolean>(false);
  readonly animationSpeed = input<number>();
  readonly infinite = input<boolean>(false);
  readonly arrowKeyMove = input<boolean>(true);
  readonly showVideoControls = input<boolean>(true);
  readonly fallbackImage = input<string>();

  // @Output
  readonly closed = output<void>();
  readonly prevImage = output<LightboxArrowAction>();
  readonly nextImage = output<LightboxArrowAction>();

  constructor() {
    effect(() => {
      const index = this.imageIndex();
      if (index !== undefined && index > -1 && index < this.images().length) {
        this.currentImageIndex = index;
      }
      this.nextPrevDisable();
    });

    effect(() => {
      const visiableFlag = this.show();
      this.imageFullscreenView = visiableFlag;
      this.elRef.nativeElement.ownerDocument.body.style.overflow = '';
      if (visiableFlag === true) {
        this.elRef.nativeElement.ownerDocument.body.style.overflow = 'hidden';
        this.setPopupSliderWidth();
      }
    });

    effect(() => {
      const data = this.animationSpeed();
      if (data && typeof data === 'number' && data >= 0.1 && data <= 5) {
        this.speed = data;
      }
    });
  }

  onResize() {
    this.effectStyle = 'none';
    this.setPopupSliderWidth();
  }
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event && event.key && this.arrowKeyMove()) {
      if (event.key.toLowerCase() === 'arrowright') {
        this.nextImageLightbox();
      }

      if (event.key.toLowerCase() === 'arrowleft') {
        this.prevImageLightbox();
      }

      if (event.key.toLowerCase() === 'escape') {
        this.closeLightbox();
      }
    }
  }

  setPopupSliderWidth() {
    if (window && window.innerWidth) {
      this.popupWidth = window.innerWidth;
      this.totalImages = this.images().length;
      if (
        typeof this.currentImageIndex === 'number' &&
        this.currentImageIndex !== undefined
      ) {
        this.marginLeft = -1 * this.popupWidth * this.currentImageIndex;
        this.getImageData();
        this.nextPrevDisable();
        setTimeout(() => {
          this.showLoading = false;
        }, 500);
      }
    }
  }

  closeLightbox() {
    this.closed.emit();
  }

  prevImageLightbox() {
    this.effectStyle = `all ${this.speed}s ease-in-out`;
    if (this.currentImageIndex > 0 && !this.lightboxPrevDisable) {
      this.currentImageIndex--;
      this.prevImage.emit(LIGHTBOX_PREV_ARROW_CLICK_MESSAGE);
      this.marginLeft = -1 * this.popupWidth * this.currentImageIndex;
      this.getImageData();
      this.nextPrevDisable();
    }
  }

  nextImageLightbox() {
    this.effectStyle = `all ${this.speed}s ease-in-out`;
    if (
      this.currentImageIndex < this.images().length - 1 &&
      !this.lightboxNextDisable
    ) {
      this.currentImageIndex++;
      this.nextImage.emit(LIGHTBOX_NEXT_ARROW_CLICK_MESSAGE);
      this.marginLeft = -1 * this.popupWidth * this.currentImageIndex;
      this.getImageData();
      this.nextPrevDisable();
    }
  }

  nextPrevDisable() {
    this.lightboxNextDisable = true;
    this.lightboxPrevDisable = true;
    setTimeout(() => {
      this.applyButtonDisableCondition();
    }, this.speed * 1000);
  }

  applyButtonDisableCondition() {
    this.lightboxNextDisable = false;
    this.lightboxPrevDisable = false;
    const infinite = this.infinite();
    if (!infinite && this.currentImageIndex >= this.images().length - 1) {
      this.lightboxNextDisable = true;
    }
    if (!infinite && this.currentImageIndex <= 0) {
      this.lightboxPrevDisable = true;
    }
    this.cdRef.detectChanges();
  }

  getImageData() {
    const images = this.images();
    if (
      images &&
      images.length &&
      typeof this.currentImageIndex === 'number' &&
      this.currentImageIndex !== undefined &&
      images[this.currentImageIndex] &&
      (images[this.currentImageIndex]['image'] ||
        images[this.currentImageIndex]['video'])
    ) {
      this.title = images[this.currentImageIndex]['title'] || '';
      this.totalImages = images.length;
      // Array.from, not `for...in`: iterating an HTMLCollection with `for...in`
      // also yields its inherited enumerable members (`length`, `item`,
      // `namedItem`), and `item` passes a plain truthiness guard.
      const iframes = Array.from(this.document.getElementsByTagName('iframe'));
      for (const iframe of iframes) {
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*'
        );
      }
      const videos = Array.from(this.document.getElementsByTagName('video'));
      for (const video of videos) {
        video.pause();
      }
    }
  }

  /**
   * Swipe event handler
   * Reference from https://stackoverflow.com/a/44511007/2067646
   */
  swipeLightboxImg(e: TouchEvent, when: string): void {
    const coord: [number, number] = [
      e.changedTouches[0].pageX,
      e.changedTouches[0].pageY,
    ];
    const time = new Date().getTime();

    if (when === 'start') {
      this.swipeLightboxImgCoord = coord;
      this.swipeLightboxImgTime = time;
    } else if (when === 'end') {
      if (
        !this.swipeLightboxImgCoord ||
        this.swipeLightboxImgTime === undefined
      ) {
        return;
      }
      const direction = [
        coord[0] - this.swipeLightboxImgCoord[0],
        coord[1] - this.swipeLightboxImgCoord[1],
      ];
      const duration = time - this.swipeLightboxImgTime;

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 && // Long enough
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        // Horizontal enough
        if (direction[0] < 0) {
          this.nextImageLightbox();
        } else {
          this.prevImageLightbox();
        }
      }
    }
  }
}
