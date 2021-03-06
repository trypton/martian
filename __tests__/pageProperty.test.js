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
jest.unmock('../pageProperty.js');
import { PageProperty } from '../pageProperty.js';

describe('Page Property', () => {
    describe('constructor tests', () => {
        it('can construct a PageProperty object for the home page implicitly', () => {
            let p = new PageProperty();
            expect(p).toBeDefined();
        });
        it('can construct a PageProperty object for the home page explicitly', () => {
            let p = new PageProperty('home');
            expect(p).toBeDefined();
        });
        it('can construct a PageProperty object by page ID', () => {
            let p = new PageProperty(123);
            expect(p).toBeDefined();
        });
        it('can construct a PageProperty object by page path', () => {
            let p = new PageProperty('foo/bar');
            expect(p).toBeDefined();
        });
        it('can fail if the constructor is not called correctly', () => {
            expect(() => PageProperty()).toThrow();
        });
    });
    describe('fetching tests', () => {
        let prop = null;
        beforeEach(() => {
            prop = new PageProperty(123);
        });
        afterEach(() => {
            prop = null;
        });
        it('can fetch the properties from a page', () => {
            return prop.getProperties();
        });
        it('can filter properties by supplying a list of names', () => {
            return prop.getProperties([ 'property1', 'property2' ]);
        });
        it('can can fail gracefully if supplying an invalid name filter', () => {
            return prop.getProperties('property1').then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
        it('can fetch a single property', () => {
            return prop.getProperty('mindtouch.import#info');
        });
        it('can fail gracefully if a key is not supplied when fetching a single property', () => {
            return prop.getProperty().then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
        it('can fetch properties from children of the root page', () => {
            return prop.getPropertyForChildren('property1');
        });
        it('can fetch properties from children of the root page, and with a supplied depth', () => {
            return prop.getPropertyForChildren('property1', 2);
        });
        it('can fail gracefully if a key is not supplied when fetching children properties', () => {
            return prop.getPropertyForChildren().then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
        it('can fetch the contents of a single property', () => {
            return prop.getPropertyContents('property1');
        });
        it('can fail gracefully if a key is not supplied when fetching the contents of a property', () => {
            return prop.getPropertyContents().then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
    });
    describe('setting tests', () => {
        let prop = null;
        beforeEach(() => {
            prop = new PageProperty(123);
        });
        afterEach(() => {
            prop = null;
        });
        it('can fail gracefully if a key is not provided when setting a page property', () => {
            return prop.setProperty().then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
        it('can fail gracefully if the value text is not provided when setting a page property', () => {
            return prop.setProperty('property1').then((r) => {
                expect(r).not.toBeDefined();
            }).catch(() => {});
        });
        it('can set a page property', () => {
            return prop.setProperty('property1', { text: 'property text', type: 'text/plain' });
        });
        it('can set a page property using the default mime type', () => {
            return prop.setProperty('property1', { text: 'property text' });
        });
    });
});
