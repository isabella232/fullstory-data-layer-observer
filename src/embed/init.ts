/* eslint-disable no-underscore-dangle, camelcase */
import { Logger, LogMessageType } from '../utils/logger';
import { startsWith } from '../utils/object';
import { DataLayerObserver } from '../observer';
import { Metrics } from '../utils/metrics';

/*
This is where we initialize the DataLayerObserver from this info:

// A custom log appender; a console appender is used if one is not specified
// Default is null
window['_dlo_appender'] = null;

// A custom metric reporter; a console metric reporter is used if one is not specified
// Default is null
window['_dlo_reporter'] = null;

// Log message level, NONE = -1, ERROR = 0, WARN = 1, INFO = 2, DEBUG = 3
// Default is null
window['_dlo_logLevel'] = 1;

// OperatorOptions that is always used just before before the destination
// Default is null
window['_dlo_beforeDestination'] = null;

// Redirects output from a destination to previewDestination when testing rules
// Default is false
window['_dlo_previewMode'] = true;

// The output destination using rule selection syntax for use with previewMode
// Default is null
window['_dlo_previewDestination'] = 'console.log';

// When true reads data layer target(s) and emits the initial value(s)
// Default is false
window['_dlo_readOnLoad'] = true;

// When true validates rules to prevent processing invalid options
// Default is false
window['_dlo_validateRules'] = false;

// A function used to validate the page URL before executing the rules
// Default is null
window['_dlo_urlValidator'] = null;

// Anything on `window` that starts with `_dlo_rules` is read as a rules array
window['_dlo_rules'] = [
// rules can go here
];

window['_dlo_rulesFromAdTeam'] = [
// rules can also go here
];

window['_dlo_rulesFromOpsTeam'] = [
// rules can also go here
];

*/

function _dlo_collectRules(): any[] {
  try {
    const startTime = Date.now();
    const results: any[] = [];
    Object.getOwnPropertyNames(window).forEach((propName) => {
      if (startsWith(propName, '_dlo_rules') === false) return;

      const prop = (window as { [key: string]: any })[propName];
      if (Array.isArray(prop) === false) {
        Logger.getInstance().warn(LogMessageType.RuleInvalid,
          { property: prop, reason: 'Rules list must be an array' });
        return;
      }

      prop.forEach((rule: any) => {
        results.push(rule);
      });
    });
    Metrics.getInstance().report({
      type: 'INTEGRATION_INITIALIZED',
      status: 'SUCCESS',
      metadata: {
        detail: 'DLO rule processing time',
        numericValue: startTime - Date.now(),
      },
    });
    return results;
  } catch (err) {
    Logger.getInstance().error(LogMessageType.RuleRegistrationError, { reason: `Error: ${err}` });
    Metrics.getInstance().report({
      type: 'INTEGRATION_INITIALIZED',
      status: 'FAILURE',
      metadata: {
        detail: LogMessageType.RuleRegistrationError,
        error: `${err}`,
      },
    });
    return [];
  }
}

function _dlo_initializeFromWindow() {
  try {
    const startTime = Date.now();
    const win = (window as { [key: string]: any });

    /*
    This is called so that custom appenders (e.g. 'fullstory') are initialized early enough
    to correctly log initialization errors and recorded stats
    */
    Logger.getInstance(win._dlo_appender);
    Metrics.getInstance(win._dlo_reporter);

    if (win._dlo_observer) {
      Logger.getInstance().warn(LogMessageType.ObserverMultipleLoad);
      return;
    }

    // Read rules
    const rules = _dlo_collectRules();
    if (rules.length === 0) {
      Logger.getInstance().warn(LogMessageType.ObserverRulesNone);
    }

    win._dlo_observer = new DataLayerObserver({
      appender: win._dlo_appender || undefined,
      // TODO: reporter: win._dlo_reporter || undefined,
      beforeDestination: win._dlo_beforeDestination || undefined,
      logLevel: win._dlo_logLevel || undefined,
      previewMode: win._dlo_previewMode === true,
      previewDestination: win._dlo_previewDestination || undefined,
      readOnLoad: win._dlo_readOnLoad === true,
      validateRules: win._dlo_validateRules === true,
      urlValidator: win._dlo_urlValidator || undefined,
      rules,
    });
    Metrics.getInstance().report({
      type: 'INTEGRATION_INITIALIZED',
      status: 'SUCCESS',
      metadata: {
        detail: 'DLO rule processing time',
        numericValue: startTime - Date.now(),
      },
    });
  } catch (err) {
    Logger.getInstance().error(LogMessageType.ObserverInitializationError, { reason: `Error: ${err}` });
    Metrics.getInstance().report({
      type: 'INTEGRATION_INITIALIZED',
      status: 'FAILURE',
      metadata: {
        detail: LogMessageType.ObserverInitializationError,
        error: `${err}`,
      },
    });
  }
}

_dlo_initializeFromWindow();
