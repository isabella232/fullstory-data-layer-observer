# FullStory Data Layer Observer Rulesets

Rulesets provide out of the box rules that are compatible with common data layers and analytics vendors. Where possible, rules follow vendor guidelines and have associated test cases to ensure operation.

## Google

### Event Measurement

- [Ruleset](./google-event-measurement.js)
- [Vendor Guidelines](https://developers.google.com/analytics/devguides/collection/analyticsjs/events)
- [Tests](../test/rules-google-fullstory.spec.ts)

### Enhanced Ecommerce (UA)

- [Ruleset](./google-ua-enhanced-ecommerce.js)
- [Vendor Guidelines](https://developers.google.com/tag-manager/enhanced-ecommerce)
- [Tests](../test/rules-google-fullstory.spec.ts)

## Customer Experience Digital Data Layer 1.0 (CEDDL)

- [Ruleset](./ceddl.js)
- [Vendor Guidelines](https://www.w3.org/2013/12/ceddl-201312.pdf)
- [Tests](../test/rules-ceddl-fullstory.spec.ts)
