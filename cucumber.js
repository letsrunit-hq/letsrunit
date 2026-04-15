import { isAgentEnvironment } from '@letsrunit/cucumber/config';

export default {
  import: ['features/support/*.js'],
  format: [
    isAgentEnvironment(process.env)
      ? '@letsrunit/cucumber/agent'
      : '@letsrunit/cucumber/progress',
  ],
  worldParameters: {
    baseURL: 'https://todomvc.com/examples/react/dist/',
  },
};
