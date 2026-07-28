import {
  Component,
  DestroyRef,
  ElementRef,
  DOCUMENT,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
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
  private elRef = inject(ElementRef);
  private document = inject(DOCUMENT);

  readonly effectStyle = signal('none');

  // Measured lazily: stays 0 during SSR, where `window` does not exist.
  private readonly viewportWidth = signal(0);

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

  readonly imageFullscreenView = computed(() => this.show());

  // default speed in second
  readonly speed = computed(() => {
    const data = this.animationSpeed();
    return typeof data === 'number' && data >= 0.1 && data <= 5 ? data : 1;
  });

  // Keeps the current slide when the incoming index is out of range.
  readonly currentImageIndex = linkedSignal<
    { index: number | undefined; total: number },
    number
  >({
    source: () => ({ index: this.imageIndex(), total: this.images().length }),
    computation: ({ index, total }, previous) =>
      index !== undefined && index > -1 && index < total
        ? index
        : (previous?.value ?? 0),
  });

  readonly totalImages = computed(() => this.images().length);
  readonly popupWidth = computed(() => this.viewportWidth() || 1200);
  readonly marginLeft = computed(
    () => -1 * this.popupWidth() * this.currentImageIndex()
  );
  readonly title = computed(
    () => this.images()[this.currentImageIndex()]?.title || ''
  );

  // Locks both arrows while a slide transition is in flight, so a fast
  // double-click cannot skip past the animation.
  private readonly transitioning = signal(false);

  readonly lightboxPrevDisable = computed(
    () =>
      this.transitioning() ||
      (!this.infinite() && this.currentImageIndex() <= 0)
  );
  readonly lightboxNextDisable = computed(
    () =>
      this.transitioning() ||
      (!this.infinite() && this.currentImageIndex() >= this.images().length - 1)
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.elRef.nativeElement.ownerDocument.body.style.overflow = '';
    });

    effect(() => {
      this.elRef.nativeElement.ownerDocument.body.style.overflow = this.show()
        ? 'hidden'
        : '';
    });

    afterRenderEffect(() => {
      if (this.show()) {
        this.viewportWidth.set(window.innerWidth);
      }
    });

    effect((onCleanup) => {
      this.currentImageIndex();
      this.transitioning.set(true);
      const timer = setTimeout(
        () => this.transitioning.set(false),
        this.speed() * 1000
      );
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      this.currentImageIndex();
      untracked(() => this.pauseAllMedia());
    });
  }

  onResize() {
    this.effectStyle.set('none');
    this.viewportWidth.set(window.innerWidth);
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

  closeLightbox() {
    this.closed.emit();
  }

  prevImageLightbox() {
    this.effectStyle.set(`all ${this.speed()}s ease-in-out`);
    if (this.currentImageIndex() > 0 && !this.lightboxPrevDisable()) {
      this.currentImageIndex.update((index) => index - 1);
      this.prevImage.emit(LIGHTBOX_PREV_ARROW_CLICK_MESSAGE);
    }
  }

  nextImageLightbox() {
    this.effectStyle.set(`all ${this.speed()}s ease-in-out`);
    if (
      this.currentImageIndex() < this.images().length - 1 &&
      !this.lightboxNextDisable()
    ) {
      this.currentImageIndex.update((index) => index + 1);
      this.nextImage.emit(LIGHTBOX_NEXT_ARROW_CLICK_MESSAGE);
    }
  }

  private pauseAllMedia() {
    const image = this.images()[this.currentImageIndex()];
    if (!image || !(image['image'] || image['video'])) {
      return;
    }
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
