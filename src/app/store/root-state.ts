import { BaseState } from 'src/app/store/base/types';
import { ThemeState } from './theme/types';

// [IMPORT NEW CONTAINER STATE ABOVE] < Needed for generating containers seamlessly

/*
  Because the redux-injectors injects your reducers asynchronously somewhere in your code
  You have to declare them here manually
  Properties are optional because they are injected when the components are mounted sometime in your application's life.
  So, not available always
*/
export interface RootState {
  base?: BaseState;
  theme?: ThemeState;
}
