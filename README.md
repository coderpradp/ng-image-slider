# Angular Image Slider with Lightbox

An Angular responsive image slider with lightbox popup.
Also support youtube and mp4 video urls.

(Compatible with Angular Version: 21)

## Features!

- Responsive (support images width and height in both % and px)
- captures swipes from phones and tablets
- Compatible with Angular Universal
- Image lightbox popup
- captures keyboard next/previous arrow key event for lightbox image move
- Support Images (jpeg, jpg, gif, png and Base64-String), Youtube url and MP4 video (url and Base64-String)
- Handling runtime image arraylist changes

### Demo: https://coderpradp.github.io/ng-image-slider/

# Installation

`npm install @coderpradp/ng-image-slider --save`

# Setup :

**`NgImageSliderComponent` is standalone — import it directly wherever you need it:**

```typescript
import { Component } from '@angular/core';
import { NgImageSliderComponent } from '@coderpradp/ng-image-slider';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgImageSliderComponent,
    ...
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

Still on an `NgModule`-based app? `NgImageSliderComponent` can be added to `NgModule.imports` the
same way any standalone component can:

```typescript
@NgModule({
  declarations: [AppComponent],
  imports: [
    NgImageSliderComponent,
    ...
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

**Add component in your template file.**

```html
<ng-image-slider [images]="imageObject" #nav></ng-image-slider>
```

**ImageObject format**

```typescript
import type { ImageObject } from '@coderpradp/ng-image-slider';

imageObject: ImageObject[] = [
  {
    image: 'assets/img/slider/1.jpg',
    thumbImage: 'assets/img/slider/1_min.jpeg',
    alt: 'alt of image',
    title: 'title of image',
  },
  {
    image: '.../iOe/xHHf4nf8AE75h3j1x64ZmZ//Z==', // Support base64 image
    thumbImage: '.../iOe/xHHf4nf8AE75h3j1x64ZmZ//Z==', // Support base64 image
    title: 'Image title', // Optional: You can use this key if want to show image with title
    alt: 'Image alt', // Optional: You can use this key if want to show image with alt
    order: 1, // Optional: if you pass this key then slider images will be arrange according @input: orderType
  },
];
```

**Image, Youtube and MP4 url's object format**

```typescript
import type { ImageObject } from '@coderpradp/ng-image-slider';

imageObject: ImageObject[] = [
  {
    video: 'https://youtu.be/6pxRHBw-k8M', // Youtube url
  },
  {
    video: 'assets/video/movie.mp4', // MP4 Video url
  },
  {
    video: 'assets/video/movie2.mp4',
    posterImage: 'assets/img/slider/2_min.jpeg', // Optional: You can use this key if you want to show video poster image in slider
    title: 'Image title',
  },
  {
    image: 'assets/img/slider/1.jpg',
    thumbImage: 'assets/img/slider/1_min.jpeg',
    alt: 'Image alt',
  },
  ...
];
```

## API Reference (optional) :

| Name               | Type    | Data Type               | Description                                                                                                                                                                                                                                                                                                         | Default                               |
| ------------------ | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| images             | @Input  | `ImageObject[]`         | Array of image/video objects to render in the slider. See ImageObject format above.                                                                                                                                                                                                                                 | `[]`                                  |
| fallbackImage      | @Input  | `SliderFallbackImage`   | Sets fallback image for image load errors. See fallbackImage Input format below.                                                                                                                                                                                                                                    | null                                  |
| infinite           | @Input  | `boolean`               | Infinite sliding images if value is **true**.                                                                                                                                                                                                                                                                       | false                                 |
| imagePopup         | @Input  | `boolean`               | Enable image lightBox popup option on slider image click.                                                                                                                                                                                                                                                           | true                                  |
| animationSpeed     | @Input  | `number`                | By this user can set slider animation speed. Minimum value is **0.1 second** and Maximum value is **5 second**.                                                                                                                                                                                                     | 1                                     |
| slideImage         | @Input  | `number`                | Set how many images will move on left/right arrow click.                                                                                                                                                                                                                                                            | 1                                     |
| imageSize          | @Input  | `SliderImageSize`       | Set slider images width, height and space. space is use for set space between slider images. Pass object like `{width: '400px', height: '300px', space: 4}` or you can pass value in percentage `{width: '20%', height: '20%'}` OR set only space `{space: 4}`                                                      | `{width: 205, height: 200, space: 3}` |
| manageImageRatio   | @Input  | `boolean`               | Show images with aspect ratio if value is `true` and set imageSize width and height on parent div                                                                                                                                                                                                                   | false                                 |
| autoSlide          | @Input  | `AutoSlideConfig`       | Auto slide images according provided time interval. Option will work only if **infinite** option is **true**. For number data type minimum value is 1 second and Maximum value is 5 second. By object data type you can prevent auto slide stop behaviour on mouse hover event. `{interval: 2, stopOnHover: false}` | 0                                     |
| showArrow          | @Input  | `boolean`               | Hide/Show slider arrow buttons                                                                                                                                                                                                                                                                                      | true                                  |
| arrowKeyMove       | @Input  | `boolean`               | Disable slider and popup image left/right move on arrow key press event, if value is `false`                                                                                                                                                                                                                        | true                                  |
| videoAutoPlay      | @Input  | `boolean`               | Auto play popup video                                                                                                                                                                                                                                                                                               | false                                 |
| showVideoControls  | @Input  | `boolean`               | Hide video control if value is `false`                                                                                                                                                                                                                                                                              | true                                  |
| direction          | @Input  | `SliderDirection`       | Set text direction. You can pass **rtl** / **ltr** / **auto**                                                                                                                                                                                                                                                       | ltr                                   |
| orderType          | @Input  | `SliderOrderType`       | Arrange slider images in Ascending order by `ASC` and in Descending order by `DESC`. `order` key must be exist with image object.                                                                                                                                                                                   | ASC                                   |
| lazyLoading        | @Input  | `boolean`               | Lazy load images and Iframe if true.                                                                                                                                                                                                                                                                                | false                                 |
| defaultActiveImage | @Input  | `number`                | Set image as selected on load.                                                                                                                                                                                                                                                                                      | null                                  |
| imageClick         | @Output | `number`                | Executes when click event on slider image. Return image index.                                                                                                                                                                                                                                                      | n/a                                   |
| arrowClick         | @Output | `SliderArrowClickEvent` | Executes when click on slider left/right arrow. Returns current event name and next/previous button disabled status.                                                                                                                                                                                                | n/a                                   |
| lightboxClose      | @Output | `void`                  | Executes when lightbox close.                                                                                                                                                                                                                                                                                       | n/a                                   |
| lightboxArrowClick | @Output | `LightboxArrowAction`   | Executes when click on lightbox next/previous arrow.                                                                                                                                                                                                                                                                | n/a                                   |

## fallbackImage Input Format

```typescript
import type { SliderFallbackImage } from '@coderpradp/ng-image-slider';

fallbackImage: SliderFallbackImage = {
  image: './slider/mainImage.jpg',
  thumbImage: './slider/thumbImage.jpg',
};
```

## TypeScript types

The package exports TypeScript types for its `@Input`/`@Output` shapes — import them directly
instead of hand-rolling your own:

```typescript
import type {
  ImageObject,
  SliderImageSize,
  SliderFallbackImage,
  AutoSlideConfig,
  AutoSlideOptions,
  SliderArrowClickEvent,
  SliderDirection,
  SliderOrderType,
  SliderArrowAction,
  LightboxArrowAction,
} from '@coderpradp/ng-image-slider';
```

| Type                    | Used by                          | Shape                                                                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| `ImageObject`           | `images` @Input                  | `{ image?, thumbImage?, title?, alt?, order?, video?, videoAutoPlay?, posterImage? }` |
| `SliderImageSize`       | `imageSize` @Input               | `{ width?: number \| string; height?: number \| string; space?: number }`             |
| `SliderFallbackImage`   | `fallbackImage` @Input           | `{ image?: string; thumbImage?: string }`                                             |
| `AutoSlideConfig`       | `autoSlide` @Input               | `boolean \| number \| AutoSlideOptions`                                               |
| `AutoSlideOptions`      | object form of `AutoSlideConfig` | `{ interval: number; stopOnHover?: boolean }`                                         |
| `SliderDirection`       | `direction` @Input               | `'ltr' \| 'rtl' \| 'auto'`                                                            |
| `SliderOrderType`       | `orderType` @Input               | `'ASC' \| 'DESC'`                                                                     |
| `SliderArrowAction`     | `SliderArrowClickEvent.action`   | `'next' \| 'previous'`                                                                |
| `LightboxArrowAction`   | `lightboxArrowClick` @Output     | `'lightbox next' \| 'lightbox previous'`                                              |
| `SliderArrowClickEvent` | `arrowClick` @Output             | `{ action: SliderArrowAction; prevDisable?: boolean; nextDisable?: boolean }`         |

> **Note:** `direction`, `orderType`, `arrowClick`'s `action`, and `lightboxArrowClick` are
> literal unions rather than plain `string`. Under `strictTemplates`, binding a value whose
> declared type is `string` will not compile — annotate the field with the exported type instead,
> e.g. `slideOrderType: SliderOrderType = 'DESC';`.

## NgImageSliderService

`NgImageSliderService` is also exported (`providedIn: 'root'`) — the slider uses it internally, but
it is part of the public API if you need the same helpers:

| Method                                                                       | Returns            | Description                                                                                                       |
| ---------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `isBase64(str: string)`                                                      | `boolean`          | Whether the string is Base64-encoded.                                                                             |
| `base64FileExtension(str: string)`                                           | `string`           | Extracts the file extension from a `data:image/...;base64,...` string.                                            |
| `orderArray<T extends { order?: number }>(arr, orderType?: SliderOrderType)` | `T[]`              | Sorts in place by the `order` key; `orderType` is `'ASC'` (default) or `'DESC'`. Entries without `order` go last. |
| `isImageExist(url: string)`                                                  | `Promise<boolean>` | Resolves `true` if the image at `url` loads. Browser-only (uses `new Image()`).                                   |

## Add custom navigation button

```typescript
import { Component, viewChild } from '@angular/core';
import {
  NgImageSliderComponent,
  ImageObject,
} from '@coderpradp/ng-image-slider';

@Component({
  selector: 'sample',
  standalone: true,
  imports: [NgImageSliderComponent],
  template: `
    <ng-image-slider [images]="imageObject" #nav></ng-image-slider>
    <button (click)="prevImageClick()">Prev</button>
    <button (click)="nextImageClick()">Next</button>
  `,
})
class Sample {
  readonly nav = viewChild<NgImageSliderComponent>('nav');
  imageObject: ImageObject[] = [...];

  prevImageClick() {
    this.nav()?.prev();
  }

  nextImageClick() {
    this.nav()?.next();
  }
}
```

## License

As Angular itself, this module is released under the permissive [MIT license](http://revolunet.mit-license.org).

Your contributions and suggestions are always welcome :)
