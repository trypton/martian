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
import { pageModel } from './page.model.js';
export const searchModel = [
    { field: '@ranking', name: 'ranking' },
    { field: '@queryid', name: 'queryId', transform: 'number' },
    { field: '@querycount', name: 'queryCount', transform: 'number' },
    { field: '@count.recommendations', name: 'recommendationCount', transform: 'number' },
    { field: '@count', name: 'count', transform: 'number' },
    { field: 'parsedQuery' },
    {
        field: 'result',
        name: 'results',
        isArray: true,
        transform: [
            { field: 'author' },
            { field: 'content' },
            { field: 'date.modified', name: 'dateModified', transform: 'date' },
            { field: 'id', transform: 'number' },
            { field: 'mime' },
            { field: 'rank', transform: 'number' },
            { field: 'title' },
            { field: 'type' },
            { field: 'uri' },
            { field: 'uri.track', name: 'uriTrack' },
            { field: 'page', transform: pageModel },
            { field: 'preview' },
            {
                field: 'tag',
                name: 'tags',
                transform(value) {
                    if(value) {
                        return value.split('\n');
                    }
                }
            }
        ]
    },
    {
        field: 'summary',
        transform: [
            { field: '@path', name: 'path' },
            {
                field: 'results',
                isArray: true,
                transform: [
                    { field: '@path', name: 'path' },
                    { field: '@count', name: 'count', transform: 'number' },
                    { field: '@title', name: 'title' }
                ]
            }
        ]
    }
];
