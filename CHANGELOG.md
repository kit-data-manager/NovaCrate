# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed
- Include the font (Geist) used in the logo SVG to properly display it on all systems
- Fixed a bug where the editor would repeatedly crash when changing sorting options in the entity explorer

## [1.7.0] - 2026-01-22

### Added
- Added a CHANGELOG.md file to the repository
- Added a Changelog modal in the main menu of the editor (/editor)

### Changed
- The landing page has been redesigned to improve the user experience.
- The design of the editor has been slightly changed, introducing additional spacing and rounded corners.

## [1.6.0] - 2026-01-12

### Added

- Import Person entities from ORCID
- Import Organization entities from ROR
- Some technical documentation

## [1.5.0] - 2025-12-18

### Added

- Entity Explorer can now be organized by three categories and sorted by three different criteria.

### Fixed

- Performance improvements. Fixed major lag spikes, performance should be much better now.

### Deprecated

- The NovaCrate instance on GitHub Pages will be discontinued. A notice has been added to the landing page. The instance at [https://novacrate.datamanager.kit.edu/](https://novacrate.datamanager.kit.edu/) is the official instance from now on.

## [1.4.1] - 2025-12-04

### Fixed

- Minor UI fix

## [1.4.0] - 2025-11-06

### Added

- Added an information page at the top level (/)
- Entity editor tabs are now pushed to browser history, so they can be navigated using the backwards and forwards buttons.
- Added notification about unsaved changes when leaving the editor.

### Fixed

- Fixed a bug where the editor kept hanging when loading a crate with the same context as before.

## Versions older than 1.4.0

Changelogs for versions older than 1.4.0 are not available. You can view the release notes on [GitHub](https://github.com/kit-data-manager/NovaCrate/releases).