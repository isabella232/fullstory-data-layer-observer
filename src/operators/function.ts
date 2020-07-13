import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { select } from '../selector';

export interface FunctionOperatorOptions extends OperatorOptions {
  func: string | Function;
  thisArg?: string | object;
}

/**
 * FunctionOperator executes a function and returns the result.
 */
export class FunctionOperator implements Operator {
  static specification = {
    func: { required: true, type: ['string', 'function'] },
    thisArg: { required: false, type: ['string', 'object'] },
  };

  constructor(public options: FunctionOperatorOptions) {
    // sets this.options
  }

  handleData(data: any[]): any[] | null {
    const { func, thisArg } = this.options as FunctionOperatorOptions;

    let actualThisArg: object = globalThis;

    if (thisArg) {
      switch (typeof thisArg) {
        case 'object':
          actualThisArg = thisArg;
          break;
        case 'string':
          actualThisArg = select(thisArg);
          break;
        default:
          throw new Error('FunctionOperator has unsupported this');
      }
    }

    if (!actualThisArg) {
      throw new Error('FunctionOperator has no this');
    }

    switch (typeof func) {
      case 'function':
        return [func.apply(actualThisArg, data)];
      case 'string':
        return select(func).apply(actualThisArg, data);
      default:
        // NOTE this will stop the handler
        return null;
    }
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FunctionOperator.specification);
  }
}