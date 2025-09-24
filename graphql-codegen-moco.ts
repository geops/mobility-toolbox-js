import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  //  documents: ['src/**/*.tsx'],
  generates: {
    './src/types/moco/gql/': {
      preset: 'client',
    },
  },
  schema: '../moco3/backend/schema.graphql',
};
export default config;
