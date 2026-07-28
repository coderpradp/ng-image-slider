# Changelog

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
