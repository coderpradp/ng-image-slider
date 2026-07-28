/**
 * A single slide passed via the `images` input. A slide is either an image
 * (`image`/`thumbImage`) or a video (`video`, optionally with `posterImage`).
 */
export interface ImageObject {
  image?: string;
  thumbImage?: string;
  title?: string;
  alt?: string;
  /** Sort key consumed by `orderType`/`NgImageSliderService.orderArray`. */
  order?: number;
  video?: string;
  videoAutoPlay?: boolean;
  posterImage?: string;
  /** Populated internally by the slider (original position); do not set this yourself. */
  index?: number;
}

/** Shape accepted by the `imageSize` input. */
export interface SliderImageSize {
  space?: number;
  width?: number | string;
  height?: number | string;
}

/** Shape accepted by the `fallbackImage` input. */
export interface SliderFallbackImage {
  image?: string;
  thumbImage?: string;
}

export interface AutoSlideOptions {
  interval: number;
  stopOnHover?: boolean;
}

/**
 * Shape accepted by the `autoSlide` input: `true` enables autoslide at the
 * default interval, a `number` sets the interval (1-5s), and an options
 * object additionally controls whether hovering pauses autoslide.
 */
export type AutoSlideConfig = boolean | number | AutoSlideOptions;

/** Text direction accepted by the `direction` input. */
export type SliderDirection = 'ltr' | 'rtl' | 'auto';

/** Sort order accepted by the `orderType` input. */
export type SliderOrderType = 'ASC' | 'DESC';

/** `action` value emitted by the `arrowClick` output. */
export type SliderArrowAction = 'next' | 'previous';

/** Value emitted by the `lightboxArrowClick` output. */
export type LightboxArrowAction = 'lightbox next' | 'lightbox previous';

/** Payload emitted by the `arrowClick` output. */
export interface SliderArrowClickEvent {
  action: SliderArrowAction;
  prevDisable?: boolean;
  nextDisable?: boolean;
}
