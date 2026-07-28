# Changelog

## [21.3.0] - 2026-07-29

### Changed

- Internal state moved from lifecycle hooks to signals. Every hook is gone, replaced by
  `computed`/`linkedSignal`, `afterRenderEffect` and `DestroyRef`. The slider no longer does work
  on every change-detection cycle.

  **Potentially breaking**: `@Input`/`@Output` and methods like `prev()`/`next()` are unchanged,
  but state read off a component instance via `ViewChild` is now a signal — call it as a function
  (`slider.imageObj()`, `img.type()`).

- Hovering the next arrow now respects `autoSlide.stopOnHover`, matching the previous arrow.
- The lightbox now closes only via its close button or `Escape`. The click-outside overlay each
  slide carried has been removed.
- Video thumbnails render as plain posters instead of interactive players, matching the YouTube
  ones. A click opens the lightbox rather than toggling playback.

### Fixed

- `<video>` slides were unplayable in the lightbox: the close-outside overlay painted above the
  player and swallowed every click. YouTube was unaffected, which is why only mp4 was broken.
- `imageSize` changes applied one change late, so the slider re-measured from the previous size.
- Advancing the lightbox threw `TypeError: video.pause is not a function` when a `<video>` was
  present.
- Slides with an extensionless URL — the norm for CDNs and image services — rendered "Invalid file
  format" instead of the image. Only a URL naming an unsupported extension is now reported as
  invalid.
- Extension detection no longer reads a dot from an earlier path segment, so
  `https://example.com/v1.2/photo` is no longer misread.
- The selected-thumbnail highlight no longer sticks to a stale index when `images` is replaced by a
  shorter list or emptied. The selection is dropped once the list no longer has that slot.

### Removed

- The lightbox pre-loader spinner, which could never render.

## [21.2.0] - 2026-07-28

### Changed

- Four public types narrowed from `string` to exported literal unions: `SliderDirection`
  (`direction`), `SliderOrderType` (`orderType`, `NgImageSliderService.orderArray`),
  `SliderArrowAction` (`SliderArrowClickEvent.action`) and `LightboxArrowAction`
  (`lightboxArrowClick`). Runtime behavior is unchanged.

  **Potentially breaking under `strictTemplates`**: binding a field declared as `string` no longer
  compiles — annotate it with the exported type.

### Fixed

- mp4 playback was broken outright: the video URL was trust-wrapped and reached the DOM as
  `SafeValue` text, which the browser resolved as a relative URL.
- "Invalid file format" could never be displayed; unsupported extensions rendered an empty `<img>`.
- Slides ignored in-place `imageUrl` changes.

### Documentation

- Documented `AutoSlideOptions` and `NgImageSliderService`'s public methods; corrected the
  `orderType` and `lightboxClose` entries in the API reference.

## [21.1.1] - 2026-07-13

### Documentation

- Documented the exported TypeScript types and removed stale unmaintained-upstream content.

## [21.1.0] - 2026-07-13

### Added

- Exported TypeScript types for the public API, replacing `any` / `object`: `ImageObject`,
  `SliderImageSize`, `SliderFallbackImage`, `AutoSlideConfig`, `AutoSlideOptions` and
  `SliderArrowClickEvent`.

### Changed

- Enabled TypeScript strict mode.

## [21.0.0] - 2026-07-13

### Changed

- Migrated to Angular 21 (`@angular/core` `~21.2.18`). No consumer-facing breaking change; the
  major tracks the Angular major.

## [20.0.0] - 2026-07-13

### Removed

- **BREAKING: `NgImageSliderModule` has been removed.** The library is standalone — import
  `NgImageSliderComponent` directly. It works in both standalone `imports: []` and `NgModule.imports`.

### Changed

- Migrated to Angular 20 (`@angular/core` `~20.3.26`).
- Converted the public API to signals-first APIs (`input()`, `output()`, `viewChild()`).

## [19.0.2] - 2025-06-22

Baseline release for this changelog; see the git history for earlier versions.

[21.3.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.2.0...v21.3.0
[21.2.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.1.1...v21.2.0
[21.1.1]: https://github.com/coderpradp/ng-image-slider/compare/v21.1.0...v21.1.1
[21.1.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.0.0...v21.1.0
[21.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v20.0.0...v21.0.0
[20.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v19.0.2...v20.0.0
[19.0.2]: https://github.com/coderpradp/ng-image-slider/releases/tag/v19.0.2
