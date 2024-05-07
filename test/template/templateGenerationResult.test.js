/******************************************************************************
 *
 * Copyright (c) 2024 Oracle and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *****************************************************************************/

/**
 * @jest-environment node
 */

const { readFile } = require('fs').promises;
const path = require('path');
const Generator = require('@asyncapi/generator');
const outputDir = path.resolve('test/temp/templateGenerationResult', Math.random().toString(36).substring(7));

describe('templateGenerationResult()', () => {
  jest.setTimeout(1000000);

  const params = {
    server: 'localhost'
  };

  const expectedFiles = [
    'client.js',
    'client.py'
  ];

  beforeAll(async() => {
    const generator = new Generator('./', outputDir, { forceWrite: true, templateParams: params });
    await generator.generateFromFile(path.resolve('test','streaming.yaml')); 
  });

  it('generated correct streaming client code', async () => {
    for (const fileName of expectedFiles) { 
      /* eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe as no value holds user input */
      const file = await readFile(path.join(outputDir, fileName), 'utf8');
      expect(file).toMatchSnapshot();
    }
  });
});
