# Changelog

## Unreleased

### Fixed

- **Advancing the lightbox threw `TypeError: video.pause is not a function` when a `<video>` was
  present.** The pause-all-media loops iterated the live `HTMLCollection` with `for...in`, which
  also yields the collection's inherited enumerable members (`length`, `item`, `namedItem`) —
  and `item` passes a plain truthiness guard. Both loops now snapshot with `Array.from` and use
  `for...of`, so only real elements are visited. The `<iframe>` loop was unaffected in practice
  (those members have no `contentWindow`), just wasteful.

## [21.2.1] - 2026-07-28

### Fixed

- **Slides with an extensionless URL rendered "Invalid file format" instead of the image.**
  Making the invalid-format branch reachable in 21.2.0 exposed a much older misclassification:
  any URL whose path carries no file extension — the norm for CDNs, image services and signed
  links (`https://picsum.photos/582/537`) — fell into the unsupported-extension bucket. A URL that
  does not name an extension says nothing about its file type, so such items are now treated as
  images and left to the `<img>` error handler and `fallbackImage`. Only a URL that names an
  extension the library does not support is reported as invalid.

- Extension detection no longer reads a dot from an earlier path segment, so
  `https://example.com/v1.2/photo` is no longer misread as having an extension of `2/photo`.

## [21.2.0] - 2026-07-28

### Changed

- **Four public types narrowed from bare `string` to literal unions**, exported for consumer use:

  | Type                  | Values                                   | Used by                        |
  | --------------------- | ---------------------------------------- | ------------------------------ |
  | `SliderDirection`     | `'ltr' \| 'rtl' \| 'auto'`               | `direction` input              |
  | `SliderOrderType`     | `'ASC' \| 'DESC'`                        | `orderType` input              |
  | `SliderArrowAction`   | `'next' \| 'previous'`                   | `SliderArrowClickEvent.action` |
  | `LightboxArrowAction` | `'lightbox next' \| 'lightbox previous'` | `lightboxArrowClick` output    |

  `NgImageSliderService.orderArray` is narrowed to `SliderOrderType` too. Runtime behavior is
  unchanged.

  **Potentially breaking under `strictTemplates`**: binding a field declared as `string` no longer
  compiles — annotate it with the exported type, e.g. `slideOrderType: SliderOrderType = 'DESC';`.

- Internal: `fileUrl` no longer holds a raw URL on the video path, where its `SafeResourceUrl` type
  asserted a trust bypass that had never happened. No consumer-facing change.

### Fixed

- **mp4 playback was broken outright.** The video URL was trust-wrapped, but `source|src` has no
  sanitizer entry, so it reached the DOM as `SafeValue` text and the browser resolved it as a
  relative URL. Video URLs now use a plain-string field; the YouTube `<iframe>` keeps its
  `SafeResourceUrl`.

- **"Invalid file format" could never be displayed.** Its guard was both defeated by a truthy
  `SafeValue` sentinel and unreachable in the template, so unsupported extensions rendered an empty
  `<img>`. Such items now carry an explicit `invalid` type; items with no URL still render nothing.

- **Slides ignored in-place `imageUrl` changes.** The URL resolved only on a component's first
  change, so mutating an item object in place — the `@for` loops track by identity — left the slide
  stale. It is now re-resolved whenever the binding reports a different value.

- Documentation: `orderType` was documented under a name that is not a real input
  (`slideOrderType`), and `lightboxClose`'s data type was listed as `n/a`; it is `void`.

### Documentation

- Typed and retagged the `imageObject` / `fallbackImage` examples; backticked the primitive type
  entries in the API reference table.
- Documented `AutoSlideOptions` and `NgImageSliderService`'s four public methods.
- Demo app updated to model correct usage of the narrowed types.

## [21.1.1] - 2026-07-13

### Documentation

- Documented the exported TypeScript types in both READMEs and removed stale
  unmaintained-upstream content: a wrong compatible-Angular-version line, an Angular-8-era
  `skipLibCheck` note, and an `ng-image-slider` import path that should have been
  `@coderpradp/ng-image-slider`.

## [21.1.0] - 2026-07-13

### Added

- Exported TypeScript types for the public API, replacing `any` / `object` on the input and output
  surface: `ImageObject`, `SliderImageSize`, `SliderFallbackImage`, `AutoSlideConfig`,
  `AutoSlideOptions`, and `SliderArrowClickEvent`.

### Changed

- Enabled TypeScript strict mode across the project.

## [21.0.0] - 2026-07-13

### Changed

- Migrated to Angular 21 (`@angular/core` `~21.2.18`). Almost entirely a mechanical dependency
  bump — the codebase was already standalone and signals-first, so no library or demo code changes
  were required. No consumer-facing breaking change; the major tracks the Angular major.

## [20.0.0] - 2026-07-13

### Removed

- **BREAKING: `NgImageSliderModule` has been removed.** The library is now standalone. Import
  `NgImageSliderComponent` directly instead of the module — it works in both standalone
  `imports: []` and `NgModule.imports`.

### Changed

- Migrated to Angular 20 (`@angular/core` `~20.3.26`).
- Converted all three library components and the demo app to standalone.
- Converted the public API to signals-first APIs (`input()`, `output()`, `viewChild()`).
- Replaced the dead TSLint/codelyzer setup with ESLint + `angular-eslint`.

## [19.0.2] - 2025-06-22

Baseline release for this changelog; see the git history for earlier versions.

[21.2.1]: https://github.com/coderpradp/ng-image-slider/compare/v21.2.0...v21.2.1
[21.2.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.1.1...v21.2.0
[21.1.1]: https://github.com/coderpradp/ng-image-slider/compare/v21.1.0...v21.1.1
[21.1.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.0.0...v21.1.0
[21.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v20.0.0...v21.0.0
[20.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v19.0.2...v20.0.0
[19.0.2]: https://github.com/coderpradp/ng-image-slider/releases/tag/v19.0.2
