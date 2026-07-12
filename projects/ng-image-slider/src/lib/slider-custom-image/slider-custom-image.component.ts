import { Component, OnChanges, SimpleChanges, DOCUMENT, inject, input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgImageSliderService } from './../ng-image-slider.service';

const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/,
    validFileExtensions = ['jpeg', 'jpg', 'gif', 'png'],
    validVideoExtensions = ['mp4'];

@Component({
    selector: 'custom-img',
    templateUrl: './slider-custom-image.component.html',
    imports: [CommonModule]
})
export class SliderCustomImageComponent implements OnChanges {
    imageSliderService = inject(NgImageSliderService);
    private sanitizer = inject(DomSanitizer);

    YOUTUBE = 'youtube';
    IMAGE = 'image';
    VIDEO = 'video';
    fileUrl: SafeResourceUrl = '';
    fileExtension = '';
    type = this.IMAGE;
    imageLoading = true;

    // @inputs
    readonly showVideo = input<boolean>(false);
    readonly videoAutoPlay = input<boolean>(false);
    readonly showVideoControls = input<number>(1);
    readonly currentImageIndex = input<number>(undefined);
    readonly imageIndex = input<number>(undefined);
    readonly speed = input<number>(1);
    readonly imageUrl = input(undefined);
    readonly isVideo = input(false);
    readonly alt = input<string>('');
    readonly title = input<string>('');
    readonly direction = input<string>('ltr');
    readonly ratio = input<boolean>(false);
    readonly lazy = input<boolean>(false);
    readonly fallbackImage = input<string>(undefined);

    ngOnChanges(changes: SimpleChanges) {
      const imageUrl = this.imageUrl();
      if (imageUrl && typeof imageUrl === 'string') {
        const firstChange = changes.imageUrl?.firstChange ?? false;
        if (firstChange || this.videoAutoPlay()) {
          this.setUrl();
        }
      }
    }

    setUrl() {
      const url: string = this.imageUrl();
      this.imageLoading = true;

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
            extension = pathParts.pop().toLowerCase();
          }
        } catch {
          // Fallback
          const parts = url.split('.');
          if (parts.length > 1) {
            extension = parts.pop().split(/\#|\?/)[0].toLowerCase();
          }
        }
      }

      this.fileExtension = extension;

      // Check if it's a YouTube URL
      const match = url.match(youtubeRegExp);
      if (match && match[2]?.length === 11) {
        const videoId = match[2];
        if (this.showVideo()) {
          this.type = this.YOUTUBE;
          const autoplayParam = this.videoAutoPlay() ? '1' : '0';
          this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&enablejsapi=1&controls=${this.showVideoControls()}`,
          );
        } else {
          this.type = this.IMAGE;
          this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://img.youtube.com/vi/${videoId}/0.jpg`,
          );
        }
        this.fileExtension = '';
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

        if (this.videoAutoPlay()) {
          const videoElement = document.getElementById(
            `video_${this.imageIndex()}`,
          ) as HTMLVideoElement;
          if (videoElement) {
            setTimeout(() => {
              videoElement.play();
            }, this.speed() * 1000);
          }
        }
        return;
      }

      // Fallback for unknown extensions: clear fileExtension and default to image
      this.fileExtension = '';
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
      this.type = this.IMAGE;
    }

    videoClickHandler(event) {
        if (event && event.srcElement && !this.showVideoControls()) {
            if (event.srcElement.paused) {
                event.srcElement.play();
            } else {
                event.srcElement.pause();
            }
        }
    }

    // set fallback url if error in image load
    async errorHandler(event) {
        const fallbackImage = this.fallbackImage();
        if (fallbackImage && await this.imageSliderService.isImageExist(fallbackImage)) {
            event.target.src = fallbackImage;
        }
    }
}
