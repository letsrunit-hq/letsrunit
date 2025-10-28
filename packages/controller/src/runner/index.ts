export { runner } from './dsl';

// Register custom parameter types
import './parameters';

// Register step definitions
import './steps/form';
import './steps/keyboard';
import './steps/misc';
import './steps/mouse';
import './steps/navigation';
import './steps/wait';
