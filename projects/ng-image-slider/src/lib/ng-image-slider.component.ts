import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnChanges,
  DoCheck,
  SimpleChanges,
  SimpleChange,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation,
  PLATFORM_ID,
  ElementRef,
  effect,
  inject,
  input,
  output,
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
} from './ng-image-slider.models';

const NEXT_ARROW_CLICK_MESSAGE = 'next',
  PREV_ARROW_CLICK_MESSAGE = 'previous';

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
export class NgImageSliderComponent
  implements OnChanges, OnInit, DoCheck, AfterViewInit, OnDestroy
{
  private cdRef = inject(ChangeDetectorRef);
  private platformId = inject<object>(PLATFORM_ID);
  imageSliderService = inject(NgImageSliderService);
  private elRef = inject(ElementRef);

  // for slider
  sliderMainDivWidth = 0;
  imageParentDivWidth = 0;
  imageObj: ImageObject[] = [];
  ligthboxImageObj: ImageObject[] = [];
  totalImages = 0;
  leftPos = 0;
  effectStyle = 'all 1s ease-in-out';
  speed = 1; // default speed in second
  sliderPrevDisable = false;
  sliderNextDisable = false;
  slideImageCount = 1;
  sliderImageWidth = 205;
  sliderImageReceivedWidth: number | string = 205;
  sliderImageHeight = 200;
  sliderImageReceivedHeight: number | string = 205;
  sliderImageSizeWithPadding = 211;
  autoSlideCount = 0;
  stopSlideOnHover = true;
  autoSlideInterval?: ReturnType<typeof setInterval>;
  showArrowButton = true;
  textDirection = 'ltr';
  imageMargin = 3;
  sliderOrderType = 'ASC';
  fallbackMainImage?: string;
  fallbackThumbImage?: string;

  // for swipe event
  private swipeCoord?: [number, number];
  private swipeTime?: number;

  // for lightbox
  ligthboxShow = false;
  activeImageIndex = -1;
  visiableImageIndex = 0;

  readonly sliderMain = viewChild<ElementRef>('sliderMain');
  readonly imageDiv = viewChild<ElementRef>('imageDiv');

  // @inputs
  readonly imageSize = input<SliderImageSize>();
  readonly infinite = input<boolean>(false);
  readonly imagePopup = input<boolean>(true);
  readonly direction = input<string>();
  readonly animationSpeed = input<number>();
  readonly images = input<ImageObject[]>([]);
  readonly fallbackImage = input<SliderFallbackImage>();
  readonly slideImage = input<number>();
  readonly autoSlide = input<AutoSlideConfig>();
  readonly showArrow = input<boolean>();
  readonly orderType = input<string>();
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
  readonly lightboxArrowClick = output<string>();
  readonly lightboxClose = output<void>();

  constructor() {
    effect(() => {
      const data = this.imageSize();
      if (data && typeof data === 'object') {
        if (
          Object.prototype.hasOwnProperty.call(data, 'space') &&
          typeof data['space'] === 'number' &&
          data['space'] > -1
        ) {
          this.imageMargin = data['space'];
        }
        if (
          Object.prototype.hasOwnProperty.call(data, 'width') &&
          (typeof data['width'] === 'number' ||
            typeof data['width'] === 'string')
        ) {
          this.sliderImageReceivedWidth = data['width'];
        }
        if (
          Object.prototype.hasOwnProperty.call(data, 'height') &&
          (typeof data['height'] === 'number' ||
            typeof data['height'] === 'string')
        ) {
          this.sliderImageReceivedHeight = data['height'];
        }
      }
    });

    effect(() => {
      const dir = this.direction();
      if (dir) {
        this.textDirection = dir;
      }
    });

    effect(() => {
      const data = this.animationSpeed();
      if (data && typeof data === 'number' && data >= 0.1 && data <= 5) {
        this.speed = data;
        this.effectStyle = `all ${this.speed}s ease-in-out`;
      }
    });

    effect(() => {
      const images = this.fallbackImage();
      if (images) {
        if (Object.prototype.hasOwnProperty.call(images, 'image')) {
          this.fallbackMainImage = images['image'];
        }
        if (Object.prototype.hasOwnProperty.call(images, 'thumbImage')) {
          this.fallbackThumbImage = images['thumbImage'];
        }
      }
    });

    effect(() => {
      const count = this.slideImage();
      if (count && typeof count === 'number') {
        this.slideImageCount = Math.round(count);
      }
    });

    effect(() => {
      let count: AutoSlideConfig | undefined = this.autoSlide();
      if (
        count &&
        (typeof count === 'number' ||
          typeof count === 'boolean' ||
          typeof count === 'object')
      ) {
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
          this.stopSlideOnHover = Object.prototype.hasOwnProperty.call(
            count,
            'stopOnHover'
          )
            ? !!count['stopOnHover']
            : true;
          count = Math.round(count['interval']);
        }
        this.autoSlideCount = Number(count) * 1000;
      }
    });

    effect(() => {
      const flag = this.showArrow();
      if (flag !== undefined && typeof flag === 'boolean') {
        this.showArrowButton = flag;
      }
    });

    effect(() => {
      const data = this.orderType();
      if (data !== undefined && typeof data === 'string') {
        this.sliderOrderType = data.toUpperCase();
      }
    });

    effect(() => {
      const activeIndex = this.defaultActiveImage();
      if (typeof activeIndex === 'number' && activeIndex > -1) {
        this.activeImageIndex = activeIndex;
      }
    });
  }

  onResize() {
    this.setSliderWidth();
  }
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event && event.key) {
      const arrowKeyMove = this.arrowKeyMove();
      if (
        event.key.toLowerCase() === 'arrowright' &&
        !this.ligthboxShow &&
        arrowKeyMove
      ) {
        this.next();
      }

      if (
        event.key.toLowerCase() === 'arrowleft' &&
        !this.ligthboxShow &&
        arrowKeyMove
      ) {
        this.prev();
      }

      if (event.key.toLowerCase() === 'escape' && this.ligthboxShow) {
        this.close();
      }
    }
  }

  ngOnInit() {
    // for slider
    if (this.infinite()) {
      this.effectStyle = 'none';
      this.leftPos =
        -1 * this.sliderImageSizeWithPadding * this.slideImageCount;
      for (let i = 1; i <= this.slideImageCount; i++) {
        this.imageObj.unshift(this.imageObj[this.imageObj.length - i]);
      }
    }
  }

  // for slider
  ngAfterViewInit() {
    this.setSliderWidth();
    this.cdRef.detectChanges();
    if (isPlatformBrowser(this.platformId)) {
      this.imageAutoSlide();
    }
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    if (this.ligthboxShow === true) {
      this.close();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.images &&
      Object.prototype.hasOwnProperty.call(changes.images, 'previousValue') &&
      Object.prototype.hasOwnProperty.call(changes.images, 'currentValue') &&
      changes.images.previousValue != changes.images.currentValue
    ) {
      this.setSliderImages(changes.images.currentValue);
    }
    if (changes && changes.imageSize) {
      const size: SimpleChange = changes.imageSize;
      if (
        size &&
        size.previousValue &&
        size.currentValue &&
        size.previousValue.width &&
        size.previousValue.height &&
        size.currentValue.width &&
        size.currentValue.height &&
        (size.previousValue.width !== size.currentValue.width ||
          size.previousValue.height !== size.currentValue.height)
      ) {
        this.setSliderWidth();
      }
    }
  }

  ngDoCheck() {
    const images = this.images();
    if (
      images &&
      this.ligthboxImageObj &&
      images.length !== this.ligthboxImageObj.length
    ) {
      this.setSliderImages(images);
    }
  }

  setSliderImages(imgObj: ImageObject[]) {
    if (imgObj && imgObj instanceof Array && imgObj.length) {
      const sliderOrderEnable = imgObj.find((img) => {
        if (Object.prototype.hasOwnProperty.call(img, 'order')) {
          return true;
        }
        return false;
      });

      if (sliderOrderEnable) {
        imgObj = this.imageSliderService.orderArray(
          imgObj,
          this.sliderOrderType.toUpperCase()
        );
      }

      this.imageObj = imgObj.map((img, index) => {
        img.index = index;
        return img;
      });
      this.ligthboxImageObj = [...this.imageObj];
      this.totalImages = this.imageObj.length;
    } else {
      this.imageObj = [];
      this.ligthboxImageObj = [];
      this.totalImages = 0;
      this.imageParentDivWidth = 0;
      this.activeImageIndex = 0;
    }

    this.setSliderWidth();
  }

  setSliderWidth() {
    const sliderMain = this.sliderMain();
    if (
      sliderMain &&
      sliderMain.nativeElement &&
      sliderMain.nativeElement.offsetWidth
    ) {
      this.sliderMainDivWidth = sliderMain.nativeElement.offsetWidth;
    }

    if (this.sliderMainDivWidth && this.sliderImageReceivedWidth) {
      if (typeof this.sliderImageReceivedWidth === 'number') {
        this.sliderImageWidth = this.sliderImageReceivedWidth;
      } else if (typeof this.sliderImageReceivedWidth === 'string') {
        if (this.sliderImageReceivedWidth.indexOf('px') >= 0) {
          this.sliderImageWidth = parseFloat(this.sliderImageReceivedWidth);
        } else if (this.sliderImageReceivedWidth.indexOf('%') >= 0) {
          this.sliderImageWidth = +(
            (this.sliderMainDivWidth *
              parseFloat(this.sliderImageReceivedWidth)) /
            100
          ).toFixed(2);
        } else if (parseFloat(this.sliderImageReceivedWidth)) {
          this.sliderImageWidth = parseFloat(this.sliderImageReceivedWidth);
        }
      }
    }
    if (isPlatformBrowser(this.platformId)) {
      if (window && window.innerHeight && this.sliderImageReceivedHeight) {
        if (typeof this.sliderImageReceivedHeight === 'number') {
          this.sliderImageHeight = this.sliderImageReceivedHeight;
        } else if (typeof this.sliderImageReceivedHeight === 'string') {
          if (this.sliderImageReceivedHeight.indexOf('px') >= 0) {
            this.sliderImageHeight = parseFloat(this.sliderImageReceivedHeight);
          } else if (this.sliderImageReceivedHeight.indexOf('%') >= 0) {
            this.sliderImageHeight = +(
              (window.innerHeight *
                parseFloat(this.sliderImageReceivedHeight)) /
              100
            ).toFixed(2);
          } else if (parseFloat(this.sliderImageReceivedHeight)) {
            this.sliderImageHeight = parseFloat(this.sliderImageReceivedHeight);
          }
        }
      }
    }
    this.sliderImageSizeWithPadding =
      this.sliderImageWidth + this.imageMargin * 2;
    this.imageParentDivWidth =
      this.imageObj.length * this.sliderImageSizeWithPadding;
    const imageDiv = this.imageDiv();
    if (
      imageDiv &&
      imageDiv.nativeElement &&
      imageDiv.nativeElement.offsetWidth
    ) {
      const staticLeftPos =
        0 - this.sliderImageSizeWithPadding * this.visiableImageIndex;
      this.leftPos = this.infinite()
        ? -1 * this.sliderImageSizeWithPadding * this.slideImageCount
        : staticLeftPos;
    }
    this.nextPrevSliderButtonDisable();
  }

  imageOnClick(index: number) {
    this.activeImageIndex = index;
    if (this.imagePopup()) {
      this.showLightbox();
    }
    this.imageClick.emit(index);
  }

  imageAutoSlide() {
    if (this.infinite() && this.autoSlideCount && !this.ligthboxShow) {
      this.autoSlideInterval = setInterval(() => {
        this.next();
      }, this.autoSlideCount);
    }
  }

  imageMouseEnterHandler() {
    if (this.infinite() && this.autoSlideCount && this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  prev() {
    if (!this.sliderPrevDisable) {
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
    if (!this.sliderNextDisable) {
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
    if (
      0 >=
      this.leftPos + this.sliderImageSizeWithPadding * this.slideImageCount
    ) {
      this.leftPos += this.sliderImageSizeWithPadding * this.slideImageCount;
    } else {
      this.leftPos = 0;
    }
  }

  nextImg() {
    if (
      this.imageParentDivWidth + this.leftPos - this.sliderMainDivWidth >
      this.sliderImageSizeWithPadding * this.slideImageCount
    ) {
      this.leftPos -= this.sliderImageSizeWithPadding * this.slideImageCount;
    } else if (
      this.imageParentDivWidth + this.leftPos - this.sliderMainDivWidth >
      0
    ) {
      this.leftPos -=
        this.imageParentDivWidth + this.leftPos - this.sliderMainDivWidth;
    }
  }

  infinitePrevImg() {
    this.effectStyle = `all ${this.speed}s ease-in-out`;
    this.leftPos = 0;

    setTimeout(() => {
      this.effectStyle = 'none';
      this.leftPos =
        -1 * this.sliderImageSizeWithPadding * this.slideImageCount;
      for (let i = 0; i < this.slideImageCount; i++) {
        this.imageObj.unshift(
          this.imageObj[this.imageObj.length - this.slideImageCount - 1]
        );
        this.imageObj.pop();
      }
    }, this.speed * 1000);
  }

  infiniteNextImg() {
    this.effectStyle = `all ${this.speed}s ease-in-out`;
    this.leftPos = -2 * this.sliderImageSizeWithPadding * this.slideImageCount;
    setTimeout(() => {
      this.effectStyle = 'none';
      for (let i = 0; i < this.slideImageCount; i++) {
        this.imageObj.push(this.imageObj[this.slideImageCount]);
        this.imageObj.shift();
      }
      this.leftPos =
        -1 * this.sliderImageSizeWithPadding * this.slideImageCount;
    }, this.speed * 1000);
  }

  getVisiableIndex() {
    const currentIndex = Math.round(
      (Math.abs(this.leftPos) + this.sliderImageWidth) / this.sliderImageWidth
    );
    const img = this.imageObj[currentIndex - 1];
    if (img && img.index !== undefined) {
      this.visiableImageIndex = img.index;
    }
  }

  /**
   * Disable slider left/right arrow when image moving
   */
  sliderArrowDisableTeam(msg: string) {
    this.sliderNextDisable = true;
    this.sliderPrevDisable = true;
    setTimeout(() => {
      this.nextPrevSliderButtonDisable(msg);
    }, this.speed * 1000);
  }

  nextPrevSliderButtonDisable(msg?: string) {
    this.sliderNextDisable = false;
    this.sliderPrevDisable = false;
    const actionMsg: { prevDisable?: boolean; nextDisable?: boolean } = {};
    if (!this.infinite()) {
      if (this.imageParentDivWidth + this.leftPos <= this.sliderMainDivWidth) {
        this.sliderNextDisable = true;
      }

      if (this.leftPos >= 0) {
        this.sliderPrevDisable = true;
      }

      actionMsg.prevDisable = this.sliderPrevDisable;
      actionMsg.nextDisable = this.sliderNextDisable;
    }

    if (msg) {
      this.arrowClick.emit({
        action: msg,
        ...actionMsg,
      });
    }
  }

  // for lightbox
  showLightbox() {
    if (this.imageObj.length) {
      this.imageMouseEnterHandler();
      this.ligthboxShow = true;
      this.elRef.nativeElement.ownerDocument.body.style.overflow = 'hidden';
    }
  }

  close() {
    this.ligthboxShow = false;
    this.elRef.nativeElement.ownerDocument.body.style.overflow = '';
    this.lightboxClose.emit();
    this.imageAutoSlide();
  }

  lightboxArrowClickHandler(event: string) {
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
