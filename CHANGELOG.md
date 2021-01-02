# Changelog for node-ddns

The format is based on [Keep a Changelog][keep-a-changelog]
<!-- and this project adheres to [Semantic Versioning][semantic-versioning]. -->

## [Unreleased]
- Nothing

## [1.0.1] (2021-01-02)
### New
- Implemented query timeout in all clients
- Implemented a short-quick-type quiers directly in ddns class
- Added simple recursive server example

### Changes
- Changed internal naming of createNXDomainResponseFromRequest to createNotFoundResponseFromRequest in serverutils
- Changed internal naming of rawQuery to Query in all clients
- Updated examples and readme to support new short-quick-type queries

### Fixes
- Cleanup of lingering objects on errors or rejects in all clients

## [1.0.0] (2021-01-01)
- Initial release

[keep-a-changelog]: http://keepachangelog.com/en/1.0.0/
[Unreleased]: https://github.com/DSorlov/node-ddns/compare/master...dev
[1.0.1]: https://github.com/DSorlov/node-ddns/releases/tag/v1.0.1
[1.0.0]: https://github.com/DSorlov/node-ddns/releases/tag/v1.0.0