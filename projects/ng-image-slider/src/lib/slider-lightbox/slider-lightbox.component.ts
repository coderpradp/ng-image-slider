import {
  ChangeDetectorRef,
  Component,
  Input,
  HostListener,
  ElementRef,
  DOCUMENT,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { SliderCustomImageComponent } from '../slider-custom-image/slider-custom-image.component';

const LIGHTBOX_NEXT_ARROW_CLICK_MESSAGE = 'lightbox next',
  LIGHTBOX_PREV_ARROW_CLICK_MESSAGE = 'lightbox previous';

@Component({
  selector: 'lib-slider-lightbox',
  templateUrl: './slider-lightbox.component.html',
  imports: [CommonModule, SliderCustomImageComponent],
})
export class SliderLightboxComponent {
  private cdRef = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private elRef = inject(ElementRef);
  private document = inject(DOCUMENT);

  totalImages = 0;
  nextImageIndex = -1;
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

  readonly lightboxDiv = viewChild('lightboxDiv');
  readonly lightboxImageDiv = viewChild('lightboxImageDiv');

  // @Inputs
  readonly images = input<any[]>([]);
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set imageIndex(index: number) {
    if (index !== undefined && index > -1 && index < this.images().length) {
      this.currentImageIndex = index;
    }
    this.nextPrevDisable();
  }
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set show(visiableFlag: boolean) {
    this.imageFullscreenView = visiableFlag;
    this.elRef.nativeElement.ownerDocument.body.style.overflow = '';
    if (visiableFlag === true) {
      this.elRef.nativeElement.ownerDocument.body.style.overflow = 'hidden';
      // this.getImageData();
      this.setPopupSliderWidth();
    }
  }
  readonly videoAutoPlay = input<boolean>(false);
  readonly direction = input<string>('ltr');
  readonly paginationShow = input<boolean>(false);
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  set animationSpeed(data: number) {
    if (data && typeof data === 'number' && data >= 0.1 && data <= 5) {
      this.speed = data;
    }
  }
  readonly infinite = input<boolean>(false);
  readonly arrowKeyMove = input<boolean>(true);
  readonly showVideoControls = input<boolean>(true);
  readonly fallbackImage = input<string>(undefined);

  // @Output
  // Named "closed" (not close) to avoid @angular-eslint/no-output-native clashing with the native DOM "close" event.
  readonly closed = output<void>();
  readonly prevImage = output<string>();
  readonly nextImage = output<string>();

  @HostListener('window:resize')
  onResize() {
    this.effectStyle = 'none';
    this.setPopupSliderWidth();
  }
  @HostListener('document:keyup', ['$event'])
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
      const iframes = this.document.getElementsByTagName('iframe');
      for (const iframeI in iframes) {
        if (iframes[iframeI] && iframes[iframeI].contentWindow?.postMessage) {
          iframes[iframeI].contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            '*'
          );
        }
      }
      for (const videoI in this.document.getElementsByTagName('video')) {
        if (
          this.document.getElementsByTagName('video')[videoI] &&
          this.document.getElementsByTagName('video')[videoI].pause
        ) {
          this.document.getElementsByTagName('video')[videoI].pause();
        }
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
