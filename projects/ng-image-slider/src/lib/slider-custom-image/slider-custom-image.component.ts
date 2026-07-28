import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgImageSliderService } from './../ng-image-slider.service';
import { SliderDirection } from '../ng-image-slider.models';

const youtubeRegExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/,
  validFileExtensions = ['jpeg', 'jpg', 'gif', 'png'],
  validVideoExtensions = ['mp4'];

interface ResolvedSource {
  type: string;
  // Only ever a trust-bypassed value or ''. Must stay falsy while no URL has
  // resolved: an item with no URL leaves it '', and the template's
  // `@else if (fileUrl() || videoSrc())` is what makes it render nothing. A
  // bypassSecurityTrust* call would return a truthy SafeValue even for an empty
  // URL and defeat that gate.
  fileUrl: SafeResourceUrl;
  // Must stay a plain string: `source|src` has no entry in Angular's security
  // schema, so a SafeValue bound here is never unwrapped and reaches the DOM as
  // its toString() text ("SafeValue must use [property]=binding: ...").
  videoSrc: string | null;
}

@Component({
  selector: 'lib-custom-img',
  templateUrl: './slider-custom-image.component.html',
  imports: [CommonModule],
})
export class SliderCustomImageComponent {
  imageSliderService = inject(NgImageSliderService);
  private sanitizer = inject(DomSanitizer);

  YOUTUBE = 'youtube';
  IMAGE = 'image';
  VIDEO = 'video';
  INVALID = 'invalid';

  private readonly videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  // @inputs
  readonly showVideo = input<boolean>(false);
  readonly videoAutoPlay = input<boolean>(false);
  readonly showVideoControls = input<number>(1);
  readonly imageIndex = input<number>();
  readonly speed = input<number>(1);
  readonly imageUrl = input<string>();
  readonly isVideo = input(false);
  readonly alt = input<string>('');
  readonly title = input<string>('');
  readonly direction = input<SliderDirection>('ltr');
  readonly ratio = input<boolean>(false);
  readonly lazy = input<boolean>(false);
  readonly fallbackImage = input<string>();

  private readonly resolved = computed<ResolvedSource>(() => {
    const url = this.imageUrl();
    if (!url) {
      return { type: this.IMAGE, fileUrl: '', videoSrc: null };
    }

    let extension = '';

    if (url.startsWith('data:')) {
      extension = this.imageSliderService
        .base64FileExtension(url)
        .toLowerCase();
    } else {
      let path: string;
      try {
        path = new URL(url).pathname;
      } catch {
        // Relative or malformed URL: strip query/fragment by hand.
        path = url.split(/#|\?/)[0];
      }
      // Only the last path segment can carry the extension; a dot earlier in
      // the path (e.g. /v1.2/photo) says nothing about the file type.
      const lastSegment = path.slice(path.lastIndexOf('/') + 1);
      const dotIndex = lastSegment.lastIndexOf('.');
      if (dotIndex > -1) {
        extension = lastSegment.slice(dotIndex + 1).toLowerCase();
      }
    }

    const match = url.match(youtubeRegExp);
    if (match && match[2]?.length === 11) {
      const videoId = match[2];
      if (this.showVideo()) {
        const autoplayParam = this.videoAutoPlay() ? '1' : '0';
        return {
          type: this.YOUTUBE,
          fileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&enablejsapi=1&controls=${this.showVideoControls()}`
          ),
          videoSrc: null,
        };
      }
      return {
        type: this.IMAGE,
        fileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://img.youtube.com/vi/${videoId}/0.jpg`
        ),
        videoSrc: null,
      };
    }

    if (validFileExtensions.includes(extension)) {
      return {
        type: this.IMAGE,
        fileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        videoSrc: null,
      };
    }

    if (validVideoExtensions.includes(extension)) {
      // fileUrl stays '' here: the VIDEO case binds videoSrc, and the template
      // wrapper gates on `fileUrl() || videoSrc()`. Assigning the raw url would
      // make the SafeResourceUrl annotation a lie.
      return { type: this.VIDEO, fileUrl: '', videoSrc: url };
    }

    // Extensionless URLs are ordinary for CDNs and signed links, so they say
    // nothing about the file type: assume an image and let the <img> error
    // handler fall back. Only a URL that names an extension we don't support
    // is genuinely invalid.
    if (!extension) {
      return {
        type: this.IMAGE,
        fileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
        videoSrc: null,
      };
    }

    return { type: this.INVALID, fileUrl: '', videoSrc: null };
  });

  readonly type = computed(() => this.resolved().type);
  readonly fileUrl = computed(() => this.resolved().fileUrl);
  readonly videoSrc = computed(() => this.resolved().videoSrc);

  // Resets on every new source; the template's (load) handler clears it.
  readonly imageLoading = linkedSignal({
    source: this.resolved,
    computation: () => true,
  });

  constructor() {
    afterRenderEffect((onCleanup) => {
      const el = this.videoEl()?.nativeElement;
      if (!el || !this.videoSrc() || !this.videoAutoPlay()) {
        return;
      }
      // Delayed so playback starts once the lightbox slide transition that
      // brought this video into view has finished.
      const timer = setTimeout(() => el.play(), this.speed() * 1000);
      onCleanup(() => clearTimeout(timer));
    });
  }

  videoClickHandler(event: Event): void {
    const target = event.srcElement as HTMLVideoElement | null;
    if (target && !this.showVideoControls()) {
      if (target.paused) {
        target.play();
      } else {
        target.pause();
      }
    }
  }

  // set fallback url if error in image load
  async errorHandler(event: Event): Promise<void> {
    const fallbackImage = this.fallbackImage();
    if (
      fallbackImage &&
      (await this.imageSliderService.isImageExist(fallbackImage))
    ) {
      (event.target as HTMLImageElement).src = fallbackImage;
    }
  }
}
