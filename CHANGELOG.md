# Changelog

## Unreleased

### Changed

- **Narrowed four public types from bare `string` to literal unions.** `direction`, `orderType`,
  the `action` field of `arrowClick`'s payload, and the `lightboxArrowClick` output previously
  accepted or emitted any `string`. They are now typed via four new exported types:

  | Type                  | Values                                   | Used by                        |
  | --------------------- | ---------------------------------------- | ------------------------------ |
  | `SliderDirection`     | `'ltr' \| 'rtl' \| 'auto'`               | `direction` input              |
  | `SliderOrderType`     | `'ASC' \| 'DESC'`                        | `orderType` input              |
  | `SliderArrowAction`   | `'next' \| 'previous'`                   | `SliderArrowClickEvent.action` |
  | `LightboxArrowAction` | `'lightbox next' \| 'lightbox previous'` | `lightboxArrowClick` output    |

  `NgImageSliderService.orderArray`'s `orderType` parameter is narrowed to `SliderOrderType` as
  well.

  Runtime behavior is unchanged, including the existing tolerance for lowercase `orderType` values
  passed from untyped templates.

  **Potentially breaking for consumers using `strictTemplates`**: binding a value whose declared
  type is `string` (rather than a literal) now fails to compile. Annotate the field with the
  exported type instead — e.g. `slideOrderType: SliderOrderType = 'DESC';`.

- **Internal: `fileUrl` is no longer overloaded as a truthiness flag on the video path.** It is
  declared `SafeResourceUrl`, but the video branch assigned it the raw, untrusted URL purely so the
  template's `@else if (fileUrl)` wrapper would render — `SafeResourceUrl` is an empty marker
  interface, so `string` satisfies it structurally and the compiler said nothing. No live defect
  (the `video` case binds `videoSrc`, not `fileUrl`), but the annotation asserted a trust bypass
  that had not happened, which is exactly what a future editor would rely on when adding another
  `[src]` binding. `fileUrl` now stays `''` on that path and the wrapper gates on
  `fileUrl || videoSrc`; it is also reset at the top of `setUrl()` so no trusted value survives a
  change from an image item to a video item. No consumer-facing change.

### Fixed

- **A slide whose URL was mutated in place kept rendering the old URL.** `SliderCustomImageComponent`
  only re-resolved its URL when `imageUrl`'s change was the _first_ one (or when `videoAutoPlay` was
  on, which only the lightbox binds), so `setUrl()` effectively ran once per component instance. Both
  `@for` loops track by object identity, so mutating a property on an existing item — e.g.
  `imageObject[0].thumbImage = 'b.jpg'` — reuses the component rather than recreating it, and every
  derived field (`type`, `fileUrl`, `videoSrc`) kept its stale value. The URL is now re-resolved
  whenever the `imageUrl` binding reports an actually-different value; clearing it resets the
  component to rendering nothing instead of stranding the previous item's type on screen. Replacing
  the whole array (the documented pattern, and what the demo does) was unaffected and behaves as
  before.

- **`<source [src]>` inside the video player received a `SafeValue` instead of a URL.** `setUrl()`
  wrapped every branch's URL in `bypassSecurityTrustResourceUrl()`, including the video branch, and
  the template bound that one `fileUrl` field into `<source [src]>`. Angular has no sanitizer
  registered for the `source|src` pair, so the value was never unwrapped and reached the DOM as its
  `toString()` text — `"SafeValue must use [property]=binding: ..."` — which the browser then
  resolved as a relative URL, firing a bogus same-origin request that 404'd for every video item.
  Because the `<video>` element carries no `src` of its own, that `<source>` was its only media
  resource, so **mp4 playback was broken outright** — not merely accompanied by console and network
  noise. The video URL is now carried in a separate plain-string field, so it reaches the DOM
  as-written; the YouTube `<iframe>` keeps its `SafeResourceUrl`, which it genuinely requires.
  (Note that `source|src` carries `SecurityContext.NONE`, so Angular applies no sanitization to it
  either way — this restores correct behavior, it does not add sanitization that was missing.)

- **"Invalid file format" could never be displayed.** Two independent faults hid it. The
  unknown-extension fallback in `setUrl()` assigned `bypassSecurityTrustResourceUrl('')`, which
  returns a truthy `SafeValue` object, so the `@if (!fileUrl)` guard never fired; and that guard
  was itself nested inside the outer `@if (fileUrl)` wrapper, making the two conditions mutually
  exclusive and the branch unreachable regardless. An item with an unsupported extension (e.g.
  `.webp`) rendered an `<img src="">` instead of the message, which browsers resolve against the
  document URL — another spurious request. Unresolvable items now carry an explicit `invalid` type
  that the template checks before anything else, so the message renders instead of depending on a
  falsy sentinel. Items carrying no URL at all continue to render nothing, as before.

- **Documentation: the `orderType` input was documented under the wrong name.** Both READMEs listed
  it as `slideOrderType`, which is not a real input — copying the documented binding produced a
  template error. The name in the demo app (`[orderType]="slideOrderType"`) is a local field, which
  is how the wrong name survived from the unmaintained upstream.
- Documentation: `lightboxClose`'s data type was listed as `n/a`; it is `void`.

### Documentation

- Replaced `imageObject: Array<object>` with `ImageObject[]` in both `imageObject` examples, and
  retagged those fences from `js` to `typescript`.
- Retyped the `fallbackImage` example from an untyped JSON blob to a `SliderFallbackImage`-annotated
  TypeScript snippet.
- Documented `AutoSlideOptions` (exported since 21.1.0 but previously absent from the docs) and
  `NgImageSliderService`'s four public methods (`isBase64`, `base64FileExtension`, `orderArray`,
  `isImageExist`).
- Backticked the bare `boolean` / `number` / `string` entries in the API reference table for
  consistency with the named types.
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

[21.1.1]: https://github.com/coderpradp/ng-image-slider/compare/v21.1.0...v21.1.1
[21.1.0]: https://github.com/coderpradp/ng-image-slider/compare/v21.0.0...v21.1.0
[21.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v20.0.0...v21.0.0
[20.0.0]: https://github.com/coderpradp/ng-image-slider/compare/v19.0.2...v20.0.0
[19.0.2]: https://github.com/coderpradp/ng-image-slider/releases/tag/v19.0.2
