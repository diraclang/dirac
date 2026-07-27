import * as system from './system';
import * as execute from './execute';
import * as llm from './llm';
import * as variable from './variable';
import * as subroutine from './subroutine';
import * as assign from './assign';
import * as parameters from './parameters';
import * as loop from './loop';
import * as evalTag from './eval';
import * as pythonTag from './python';
import * as call from './call';
import * as defvar from './defvar';
import * as output from './output';
import * as expr from './expr';
import * as ifTag from './if';
import * as importTag from './import';
import * as mongodb from './mongodb';
import * as requireModule from './require_module';
import * as environment from './environment';
import * as input from './input';
import * as sessionLog from './session-log';

export default {
  ...system,
  ...execute,
  ...llm,
  ...variable,
  ...subroutine,
  ...assign,
  ...parameters,
  ...loop,
  ...evalTag,
  ...pythonTag,
  ...call,
  ...defvar,
  ...output,
  ...expr,
  ...ifTag,
  ...importTag,
  ...mongodb,
  ...requireModule,
  ...environment,
  ...input,
  ...sessionLog,
};
