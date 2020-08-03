import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { Logger } from '../utils/logger';

type ConvertibleType = 'bool' | 'date' | 'int' | 'real' | 'string';

export interface ConvertOperatorOptions extends OperatorOptions {
  properties: string | string[];
  type: ConvertibleType;
}

/**
 * ConvertOperator formats a value from one `type` to a bool, int, real, or string.
 * The `properties` to be converted can either be a single string property, a list of string properties separated by
 * a comma, or a native array of strings. The string `*` can also be used to denote that all properties in an object
 * should be converted to the desired `type`.
 */
export class ConvertOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    properties: { required: true, type: ['string,object'] }, // NOTE an typeof array is object
    type: { required: true, type: ['string'] },
  };

  readonly index: number;

  constructor(public options: ConvertOperatorOptions) {
    const { index = 0 } = options;

    this.index = index;
  }

  static convert(type: ConvertibleType, value: any) {
    switch (type) {
      case 'bool': return (value === 'true' || value === 'TRUE' || value === 'True');
      case 'date': return new Date(value);
      case 'int':
        if (!value) {
          return 0;
        }
        return parseInt(value, 10);

      case 'real':
        if (!value) {
          return 0.0;
        }
        return parseFloat(value);

      case 'string':
        switch (typeof value) {
          case 'boolean': return Boolean(value).toString();
          case 'number': return (value as number).toString();
          default: return value;
        }
      default: return value;
    }
  }

  handleData(data: any[]): any[] | null {
    let { properties } = this.options;
    const { type } = this.options;

    if (typeof properties === 'string') {
      properties = properties.split(',');
    }

    // NOTE if * is supplied, convert all properties
    const list = properties[0] === '*' ? Object.getOwnPropertyNames(data[this.index]) : properties;

    const converted: { [key: string]: any } = { ...data[this.index] };
    list.forEach((property) => {
      const original = data[this.index][property];
      converted[property] = ConvertOperator.convert(type, original);

      ConvertOperator.verifyConversion(type, property, converted, original);
    });

    const clone = data.slice();
    clone.splice(this.index, 1, converted);

    return clone;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(ConvertOperator.specification);

    const { type } = this.options;
    if (type !== 'bool' && type !== 'int' && type !== 'real' && type !== 'string' && type !== 'date') {
      throw validator.throwError('type', `unknown type '${type}' used`);
    }
  }

  private static verifyConversion(type: string, property: string, converted: any, oldValue: any) {
    let verified = true;

    // verify it's a number
    if ((type === 'int' || type === 'real') && Number.isNaN(converted[property])) {
      verified = false;
    }

    // verify it's a date by checking the epoch
    if (type === 'date' && Number.isNaN((converted[property] as Date).getTime())) {
      verified = false;
    }

    // log error and reset to the original value
    if (!verified) {
      Logger.getInstance().error(`Unable to convert ${property} to ${type} for value ${oldValue}`);
      converted[property] = oldValue; // eslint-disable-line no-param-reassign
    }
  }
}