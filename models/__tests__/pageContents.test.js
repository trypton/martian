/**
 * Martian - Core JavaScript API for MindTouch
 *
 * Copyright (c) 2015 MindTouch Inc.
 * www.mindtouch.com  oss@mindtouch.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env jasmine, jest */
jest.unmock('../pageContents.model.js');
import { pageContentsModel } from '../pageContents.model.js';

describe('Page Contents Model', () => {
    it('returns the parsed "body" array', () => {
        let mockData = {
            body: [
                'body content',
                {
                    '@target': 'target',
                    '#text': 'target content'
                }
            ]
        };
        let results = [];
        pageContentsModel.forEach((propertyModel) => {
            if(typeof propertyModel.transform === 'function') {
                results.push(propertyModel.transform(mockData.body));
            }
        });
        expect(results).toEqual([
            'body content',
            [ { target: 'target content' } ]
        ]);
    });
});
