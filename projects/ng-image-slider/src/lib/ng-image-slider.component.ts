import {
  Component,
  DestroyRef,
  ViewEncapsulation,
  PLATFORM_ID,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgImageSliderService } from './ng-image-slider.service';
import { SliderCustomImageComponent } from './slider-custom-image/slider-custom-image.component';
import { SliderLightboxComponent } from './slider-lightbox/slider-lightbox.component';
import {
  ImageObject,
  SliderImageSize,
  SliderFallbackImage,
  AutoSlideConfig,
  SliderArrowClickEvent,
  SliderDirection,
  SliderOrderType,
  SliderArrowAction,
  LightboxArrowAction,
} from './ng-image-slider.models';

const NEXT_ARROW_CLICK_MESSAGE: SliderArrowAction = 'next',
  PREV_ARROW_CLICK_MESSAGE: SliderArrowAction = 'previous';

@Component({
  selector: 'ng-image-slider',
  templateUrl: './ng-image-slider.component.html',
  styleUrls: ['./ng-image-slider.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, SliderCustomImageComponent, SliderLightboxComponent],
  host: {
    '(window:resize)': 'onResize()',
    '(document:keyup)': 'handleKeyboardEvent($event)',
  },
})
export class NgImageSliderComponent {
  private platformId = inject<object>(PLATFORM_ID);
  imageSliderService = inject(NgImageSliderService);
  private elRef = inject(ElementRef);

  // Measured after render; both stay 0 during SSR, which the width/height
  // derivations below treat as "not measured yet".
  private readonly containerWidth = signal(0);
  private readonly viewportHeight = signal(0);

  // for swipe event
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  private arrowLockTimer?: ReturnType<typeof setTimeout>;
  private infiniteSlideTimer?: ReturnType<typeof setTimeout>;

  // for lightbox
  readonly ligthboxShow = signal(false);
  readonly visiableImageIndex = signal(0);

  readonly sliderMain = viewChild<ElementRef>('sliderMain');
  readonly imageDiv = viewChild<ElementRef>('imageDiv');

  // @inputs
  readonly imageSize = input<SliderImageSize>();
  readonly infinite = input<boolean>(false);
  readonly imagePopup = input<boolean>(true);
  readonly direction = input<SliderDirection>();
  readonly animationSpeed = input<number>();
  readonly images = input<ImageObject[]>([]);
  readonly fallbackImage = input<SliderFallbackImage>();
  readonly slideImage = input<number>();
  readonly autoSlide = input<AutoSlideConfig>();
  readonly showArrow = input<boolean>();
  readonly orderType = input<SliderOrderType>();
  readonly videoAutoPlay = input<boolean>(false);
  readonly paginationShow = input<boolean>(false);
  readonly arrowKeyMove = input<boolean>(true);
  readonly manageImageRatio = input<boolean>(false);
  readonly showVideoControls = input<boolean>(true);
  readonly defaultActiveImage = input<number>();
  readonly lazyLoading = input<boolean>(false);

  // @Outputs
  readonly imageClick = output<number>();
  readonly arrowClick = output<SliderArrowClickEvent>();
  readonly lightboxArrowClick = output<LightboxArrowAction>();
  readonly lightboxClose = output<void>();

  readonly imageMargin = computed(() => {
    const data = this.imageSize();
    return typeof data?.space === 'number' && data.space > -1 ? data.space : 3;
  });

  readonly sliderImageReceivedWidth = computed<number | string>(() => {
    const width = this.imageSize()?.width;
    return typeof width === 'number' || typeof width === 'string' ? width : 205;
  });

  readonly sliderImageReceivedHeight = computed<number | string>(() => {
    const height = this.imageSize()?.height;
    return typeof height === 'number' || typeof height === 'string'
      ? height
      : 205;
  });

  readonly textDirection = computed<SliderDirection>(
    () => this.direction() ?? 'ltr'
  );

  // default speed in second
  readonly speed = computed(() => {
    const data = this.animationSpeed();
    return typeof data === 'number' && data >= 0.1 && data <= 5 ? data : 1;
  });

  readonly fallbackMainImage = computed(() => this.fallbackImage()?.image);
  readonly fallbackThumbImage = computed(
    () => this.fallbackImage()?.thumbImage
  );

  readonly slideImageCount = computed(() => {
    const count = this.slideImage();
    return count && typeof count === 'number' ? Math.round(count) : 1;
  });

  private readonly autoSlideConfig = computed(() => {
    let count: AutoSlideConfig | undefined = this.autoSlide();
    let stopOnHover = true;
    if (
      !count ||
      !(
        typeof count === 'number' ||
        typeof count === 'boolean' ||
        typeof count === 'object'
      )
    ) {
      return { intervalMs: 0, stopOnHover };
    }

    if (typeof count === 'number' && count >= 1 && count <= 5) {
      count = Math.round(count);
    } else if (typeof count === 'boolean') {
      count = 1;
    } else if (
      typeof count === 'object' &&
      Object.prototype.hasOwnProperty.call(count, 'interval') &&
      Math.round(count['interval']) &&
      Math.round(count['interval']) >= 1 &&
      Math.round(count['interval']) <= 5
    ) {
      stopOnHover = Object.prototype.hasOwnProperty.call(count, 'stopOnHover')
        ? !!count['stopOnHover']
        : true;
      count = Math.round(count['interval']);
    }
    return { intervalMs: Number(count) * 1000, stopOnHover };
  });

  readonly autoSlideCount = computed(() => this.autoSlideConfig().intervalMs);
  readonly stopSlideOnHover = computed(
    () => this.autoSlideConfig().stopOnHover
  );

  readonly showArrowButton = computed(() => this.showArrow() ?? true);

  readonly sliderOrderType = computed<SliderOrderType>(() => {
    const data = this.orderType();
    // Tolerate lowercase from untyped/non-strict templates.
    return typeof data === 'string' && data.toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';
  });

  // `index` is stamped onto the caller's own objects rather than onto copies:
  // the template tracks slides by identity, so fresh references would tear down
  // and rebuild every <lib-custom-img> — and its loaded image or playing video
  // with it — on every recomputation.
  readonly ligthboxImageObj = computed(() => {
    const images = this.images();
    if (!(images instanceof Array) || !images.length) {
      return [];
    }
    const hasOrder = images.some((img) =>
      Object.prototype.hasOwnProperty.call(img, 'order')
    );
    const ordered = hasOrder
      ? this.imageSliderService.orderArray(images, this.sliderOrderType())
      : images;
    ordered.forEach((img, index) => (img.index = index));
    return ordered;
  });

  readonly totalImages = computed(() => this.ligthboxImageObj().length);

  readonly activeImageIndex = linkedSignal<
    { defaultIndex: number; total: number },
    number
  >({
    source: () => {
      const index = this.defaultActiveImage();
      return {
        // Tolerate garbage from untyped/non-strict templates.
        defaultIndex: typeof index === 'number' && index > -1 ? index : -1,
        total: this.totalImages(),
      };
    },
    // A fresh `defaultActiveImage` wins outright. Otherwise the user's own pick
    // survives changes to the image list, but is dropped once the list no
    // longer has that slot — including when it empties — so a stale index can
    // never keep pointing at an image that is no longer there.
    computation: ({ defaultIndex, total }, previous) =>
      !previous || previous.source.defaultIndex !== defaultIndex
        ? defaultIndex
        : previous.value < total
          ? previous.value
          : -1,
  });

  // In infinite mode this is the ordered list with its last `slideImageCount`
  // items repeated up front, so the strip starts one page in and can scroll
  // either way; the wrap-around handlers then rotate it.
  readonly imageObj = linkedSignal(() => {
    const ordered = this.ligthboxImageObj();
    const slides = [...ordered];
    if (this.infinite() && ordered.length) {
      for (let i = 1; i <= this.slideImageCount(); i++) {
        slides.unshift(ordered[ordered.length - i]);
      }
    }
    return slides;
  });

  readonly sliderMainDivWidth = computed(() => this.containerWidth());

  readonly sliderImageWidth = computed(() => {
    const received = this.sliderImageReceivedWidth();
    const mainWidth = this.sliderMainDivWidth();
    if (!mainWidth || !received) {
      return 205;
    }
    if (typeof received === 'number') {
      return received;
    }
    if (received.indexOf('px') >= 0) {
      return parseFloat(received);
    }
    if (received.indexOf('%') >= 0) {
      return +((mainWidth * parseFloat(received)) / 100).toFixed(2);
    }
    return parseFloat(received) || 205;
  });

  readonly sliderImageHeight = computed(() => {
    const received = this.sliderImageReceivedHeight();
    const viewportHeight = this.viewportHeight();
    if (!viewportHeight || !received) {
      return 200;
    }
    if (typeof received === 'number') {
      return received;
    }
    if (received.indexOf('px') >= 0) {
      return parseFloat(received);
    }
    if (received.indexOf('%') >= 0) {
      return +((viewportHeight * parseFloat(received)) / 100).toFixed(2);
    }
    return parseFloat(received) || 200;
  });

  readonly sliderImageSizeWithPadding = computed(
    () => this.sliderImageWidth() + this.imageMargin() * 2
  );

  readonly imageParentDivWidth = computed(
    () => this.imageObj().length * this.sliderImageSizeWithPadding()
  );

  readonly effectStyle = linkedSignal(() =>
    this.infinite() ? 'none' : `all ${this.speed()}s ease-in-out`
  );

  // Re-derives on a geometry change, which re-snaps the strip after a reflow.
  // `visiableImageIndex` is read untracked on purpose — it is computed *from*
  // leftPos, so tracking it would feed the strip position back into itself.
  readonly leftPos = linkedSignal<
    { size: number; infinite: boolean; count: number; total: number },
    number
  >({
    source: () => ({
      size: this.sliderImageSizeWithPadding(),
      infinite: this.infinite(),
      count: this.slideImageCount(),
      total: this.ligthboxImageObj().length,
    }),
    computation: ({ size, infinite, count }) =>
      infinite
        ? -1 * size * count
        : -1 * size * untracked(this.visiableImageIndex),
  });

  // Locks both arrows for the duration of a slide transition, so a fast
  // double-click cannot outrun the animation.
  private readonly transitioning = signal(false);

  readonly sliderPrevDisable = computed(
    () => this.transitioning() || (!this.infinite() && this.leftPos() >= 0)
  );

  readonly sliderNextDisable = computed(
    () =>
      this.transitioning() ||
      (!this.infinite() &&
        this.imageParentDivWidth() + this.leftPos() <=
          this.sliderMainDivWidth())
  );

  private readonly hoverPaused = signal(false);

  constructor() {
    afterRenderEffect({
      earlyRead: () => {
        // Tracked so the strip is re-measured whenever its contents change.
        this.imageObj();
        return {
          container: this.sliderMain()?.nativeElement.offsetWidth ?? 0,
          viewportHeight: window.innerHeight,
        };
      },
      write: (measured) => {
        const { container, viewportHeight } = measured();
        if (container) {
          this.containerWidth.set(container);
        }
        this.viewportHeight.set(viewportHeight);
      },
    });

    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const interval = this.autoSlideCount();
      if (
        !this.infinite() ||
        !interval ||
        this.ligthboxShow() ||
        this.hoverPaused()
      ) {
        return;
      }
      const id = setInterval(() => this.next(), interval);
      onCleanup(() => clearInterval(id));
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.arrowLockTimer);
      clearTimeout(this.infiniteSlideTimer);
      if (this.ligthboxShow()) {
        this.close();
      }
    });
  }

  onResize() {
    const width = this.sliderMain()?.nativeElement.offsetWidth;
    if (width) {
      this.containerWidth.set(width);
    }
    this.viewportHeight.set(window.innerHeight);
  }

  handleKeyboardEvent(event: KeyboardEvent) {
    if (event && event.key) {
      const arrowKeyMove = this.arrowKeyMove();
      if (
        event.key.toLowerCase() === 'arrowright' &&
        !this.ligthboxShow() &&
        arrowKeyMove
      ) {
        this.next();
      }

      if (
        event.key.toLowerCase() === 'arrowleft' &&
        !this.ligthboxShow() &&
        arrowKeyMove
      ) {
        this.prev();
      }

      if (event.key.toLowerCase() === 'escape' && this.ligthboxShow()) {
        this.close();
      }
    }
  }

  imageOnClick(index: number) {
    this.activeImageIndex.set(index);
    if (this.imagePopup()) {
      this.showLightbox();
    }
    this.imageClick.emit(index);
  }

  imageMouseEnterHandler() {
    if (this.stopSlideOnHover()) {
      this.hoverPaused.set(true);
    }
  }

  imageMouseLeaveHandler() {
    this.hoverPaused.set(false);
  }

  prev() {
    if (!this.sliderPrevDisable()) {
      if (this.infinite()) {
        this.infinitePrevImg();
      } else {
        this.prevImg();
      }

      this.sliderArrowDisableTeam(PREV_ARROW_CLICK_MESSAGE);
      this.getVisiableIndex();
    }
  }

  next() {
    if (!this.sliderNextDisable()) {
      if (this.infinite()) {
        this.infiniteNextImg();
      } else {
        this.nextImg();
      }

      this.sliderArrowDisableTeam(NEXT_ARROW_CLICK_MESSAGE);
      this.getVisiableIndex();
    }
  }

  prevImg() {
    const step = this.sliderImageSizeWithPadding() * this.slideImageCount();
    this.leftPos.update((pos) => (0 >= pos + step ? pos + step : 0));
  }

  nextImg() {
    const step = this.sliderImageSizeWithPadding() * this.slideImageCount();
    const parentWidth = this.imageParentDivWidth();
    const mainWidth = this.sliderMainDivWidth();
    this.leftPos.update((pos) => {
      if (parentWidth + pos - mainWidth > step) {
        return pos - step;
      }
      if (parentWidth + pos - mainWidth > 0) {
        return mainWidth - parentWidth;
      }
      return pos;
    });
  }

  infinitePrevImg() {
    const count = this.slideImageCount();
    this.effectStyle.set(`all ${this.speed()}s ease-in-out`);
    this.leftPos.set(0);

    clearTimeout(this.infiniteSlideTimer);
    this.infiniteSlideTimer = setTimeout(() => {
      this.effectStyle.set('none');
      this.leftPos.set(-1 * this.sliderImageSizeWithPadding() * count);
      this.imageObj.update((slides) => {
        const next = [...slides];
        for (let i = 0; i < count; i++) {
          next.unshift(next[next.length - count - 1]);
          next.pop();
        }
        return next;
      });
    }, this.speed() * 1000);
  }

  infiniteNextImg() {
    const count = this.slideImageCount();
    this.effectStyle.set(`all ${this.speed()}s ease-in-out`);
    this.leftPos.set(-2 * this.sliderImageSizeWithPadding() * count);

    clearTimeout(this.infiniteSlideTimer);
    this.infiniteSlideTimer = setTimeout(() => {
      this.effectStyle.set('none');
      this.imageObj.update((slides) => {
        const next = [...slides];
        for (let i = 0; i < count; i++) {
          next.push(next[count]);
          next.shift();
        }
        return next;
      });
      this.leftPos.set(-1 * this.sliderImageSizeWithPadding() * count);
    }, this.speed() * 1000);
  }

  getVisiableIndex() {
    const imageWidth = this.sliderImageWidth();
    const currentIndex = Math.round(
      (Math.abs(this.leftPos()) + imageWidth) / imageWidth
    );
    const img = this.imageObj()[currentIndex - 1];
    if (img && img.index !== undefined) {
      this.visiableImageIndex.set(img.index);
    }
  }

  sliderArrowDisableTeam(msg: SliderArrowAction) {
    this.transitioning.set(true);
    clearTimeout(this.arrowLockTimer);
    this.arrowLockTimer = setTimeout(() => {
      this.transitioning.set(false);
      const actionMsg: { prevDisable?: boolean; nextDisable?: boolean } = {};
      if (!this.infinite()) {
        actionMsg.prevDisable = this.sliderPrevDisable();
        actionMsg.nextDisable = this.sliderNextDisable();
      }
      this.arrowClick.emit({ action: msg, ...actionMsg });
    }, this.speed() * 1000);
  }

  // for lightbox
  showLightbox() {
    if (this.imageObj().length) {
      this.ligthboxShow.set(true);
      this.elRef.nativeElement.ownerDocument.body.style.overflow = 'hidden';
    }
  }

  close() {
    this.ligthboxShow.set(false);
    this.elRef.nativeElement.ownerDocument.body.style.overflow = '';
    this.lightboxClose.emit();
  }

  lightboxArrowClickHandler(event: LightboxArrowAction) {
    this.lightboxArrowClick.emit(event);
  }

  /**
   * Swipe event handler
   * Reference from https://stackoverflow.com/a/44511007/2067646
   */
  swipe(e: TouchEvent, when: string): void {
    const coord: [number, number] = [
      e.changedTouches[0].pageX,
      e.changedTouches[0].pageY,
    ];
    const time = new Date().getTime();

    if (when === 'start') {
      this.swipeCoord = coord;
      this.swipeTime = time;
    } else if (when === 'end') {
      if (!this.swipeCoord || this.swipeTime === undefined) {
        return;
      }
      const direction = [
        coord[0] - this.swipeCoord[0],
        coord[1] - this.swipeCoord[1],
      ];
      const duration = time - this.swipeTime;

      if (
        duration < 1000 && //
        Math.abs(direction[0]) > 30 && // Long enough
        Math.abs(direction[0]) > Math.abs(direction[1] * 3)
      ) {
        // Horizontal enough
        if (direction[0] < 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }
  }
}
