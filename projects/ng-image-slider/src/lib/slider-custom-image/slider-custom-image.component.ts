import {
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgImageSliderService } from './../ng-image-slider.service';
import { SliderDirection } from '../ng-image-slider.models';

const youtubeRegExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/,
  validFileExtensions = ['jpeg', 'jpg', 'gif', 'png'],
  validVideoExtensions = ['mp4'];

@Component({
  selector: 'lib-custom-img',
  templateUrl: './slider-custom-image.component.html',
  imports: [CommonModule],
})
export class SliderCustomImageComponent implements OnChanges {
  imageSliderService = inject(NgImageSliderService);
  private sanitizer = inject(DomSanitizer);

  YOUTUBE = 'youtube';
  IMAGE = 'image';
  VIDEO = 'video';
  fileUrl: SafeResourceUrl = '';
  // Must stay a plain string: `source|src` has no entry in Angular's security
  // schema, so a SafeValue bound here is never unwrapped and reaches the DOM as
  // its toString() text ("SafeValue must use [property]=binding: ...").
  videoSrc: string | null = null;
  type = this.IMAGE;
  imageLoading = true;

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

  ngOnChanges(changes: SimpleChanges) {
    const imageUrl = this.imageUrl();
    if (imageUrl && typeof imageUrl === 'string') {
      const firstChange = changes['imageUrl']?.firstChange ?? false;
      if (firstChange || this.videoAutoPlay()) {
        this.setUrl();
      }
    }
  }

  setUrl() {
    const url = this.imageUrl();
    if (!url) {
      return;
    }
    this.imageLoading = true;
    this.videoSrc = null;

    let extension = '';

    if (url.startsWith('data:')) {
      extension = this.imageSliderService
        .base64FileExtension(url)
        .toLowerCase();
    } else {
      try {
        // Parse the URL and extract pathname to avoid query param issues
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;
        const pathParts = pathname.split('.');
        if (pathParts.length > 1) {
          const ext = pathParts.pop();
          extension = ext ? ext.toLowerCase() : '';
        }
      } catch {
        // Fallback
        const parts = url.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          extension = ext ? ext.split(/#|\?/)[0].toLowerCase() : '';
        }
      }
    }

    // Check if it's a YouTube URL
    const match = url.match(youtubeRegExp);
    if (match && match[2]?.length === 11) {
      const videoId = match[2];
      if (this.showVideo()) {
        this.type = this.YOUTUBE;
        const autoplayParam = this.videoAutoPlay() ? '1' : '0';
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&enablejsapi=1&controls=${this.showVideoControls()}`
        );
      } else {
        this.type = this.IMAGE;
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://img.youtube.com/vi/${videoId}/0.jpg`
        );
      }
      return;
    }

    // Check for valid image extension
    if (validFileExtensions.includes(extension)) {
      this.type = this.IMAGE;
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      return;
    }

    // Check for valid video extension
    if (validVideoExtensions.includes(extension)) {
      this.type = this.VIDEO;
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.videoSrc = url;

      if (this.videoAutoPlay()) {
        const videoElement = document.getElementById(
          `video_${this.imageIndex()}`
        ) as HTMLVideoElement;
        if (videoElement) {
          setTimeout(() => {
            videoElement.play();
          }, this.speed() * 1000);
        }
      }
      return;
    }

    // Must stay a falsy plain string: the template's `@else` branch renders the
    // "Invalid file format" message, and a bypassSecurityTrust* call would return a
    // truthy SafeValue object here even for an empty URL.
    this.fileUrl = '';
    this.type = this.IMAGE;
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
