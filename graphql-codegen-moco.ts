import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  generates: {
    './src/types/moco/gql/graphql.ts': {
      plugins: ['typescript'],
    },
  },
  schema: '../moco3/backend/schema.graphql',
};
export default config;
