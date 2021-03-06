/* eslint-env jasmine, jest */
jest.unmock('mindtouch-http.js/plug.js');
jest.mock('mindtouch-http.js/plug.js', () => require.requireActual('../__mocks__/plug.js'));
jest.unmock('mindtouch-http.js/progressPlug.js');
jest.mock('mindtouch-http.js/progressPlug.js', () => require.requireActual('../__mocks__/progressPlug.js'));

jest.unmock('../page.js');
jest.unmock('../pageBase.js');
jest.unmock('../lib/modelParser.js');
jest.unmock('../contextId.js');

// import { Page } from '../page.js';
// import { ContextIdManager } from '../contextId.js';

describe('Special page Tests', () => {
    beforeEach(() => {
        jest.resetModules();
    });
    it('can get the ID path in the tree', () => {
        const Response = require.requireActual('../__mocks__/response.js');
        Response.prototype.text = jest.fn(() => Promise.resolve('123,456'));
        const Page = require('../page.js').Page;
        const page = new Page(123);
        return page.getTreeIds();
    });
    it('can get the ID path in the tree (invalid data)', () => {
        const Response = require.requireActual('../__mocks__/response.js');
        Response.prototype.text = jest.fn(() => Promise.resolve('123,abc'));
        const Page = require('../page.js').Page;
        const page = new Page(123);
        return page.getTreeIds().catch(() => {});
    });
    it('can fetch the list of all context definitions (no response)', () => {
        const Response = require.requireActual('../__mocks__/response.js');
        Response.prototype.json = jest.fn(() => Promise.resolve(''));
        const ContextIdManager = require.requireActual('../contextId.js').ContextIdManager;
        const cm = new ContextIdManager();
        return cm.getDefinitions();
    });
    it('can fetch a virtual page', () => {
        jest.mock('mindtouch-http.js/plug.js', () => {
            class Plug {
                at() {
                    return new Plug();
                }
                withParam() {
                    return new Plug();
                }
                withParams() {
                    return new Plug();
                }
                get() {
                    return Promise.reject({
                        message: 'Not found',
                        status: 404,
                        responseText: '{"@virtual":"true"}'
                    });
                }
            }
            return { Plug };
        });
        const Page = require('../page.js').Page;
        let p = new Page(123);
        return p.getFullInfo().then((r) => expect(r.virtual).toBe(true));
    });
    it('can get through virtual page checking when there is another failure', () => {
        jest.mock('mindtouch-http.js/plug.js', () => {
            class Plug {
                at() {
                    return new Plug();
                }
                withParam() {
                    return new Plug();
                }
                withParams() {
                    return new Plug();
                }
                get() {
                    return Promise.reject({
                        message: 'Not found',
                        status: 404,
                        responseText: '{"notavirtualpage":true}'
                    });
                }
            }
            return { Plug };
        });
        const Page = require('../page.js').Page;
        const page = new Page(123);
        const success = jest.fn();
        return page.getFullInfo().then(() => {
            success();
            throw new Error();
        }).catch(() => {
            expect(success).not.toHaveBeenCalled();
        });
    });
    it('can get through virtual page checking when there is another failure (no responseText)', () => {
        jest.mock('mindtouch-http.js/plug.js', () => {
            class Plug {
                at() {
                    return new Plug();
                }
                withParam() {
                    return new Plug();
                }
                withParams() {
                    return new Plug();
                }
                get() {
                    return Promise.reject({
                        message: 'Not found',
                        status: 404,
                        responseText: ''
                    });
                }
            }
            return { Plug };
        });
        const Page = require('../page.js').Page;
        const page = new Page(123);
        const success = jest.fn();
        return page.getFullInfo().then(() => {
            success();
            throw new Error();
        }).catch(() => {
            expect(success).not.toHaveBeenCalled();
        });
    });
    it('can import an archive with a conflict (no progress)', () => {
        jest.mock('mindtouch-http.js/plug.js', () => {
            class Plug {
                at() {
                    return new Plug();
                }
                withHeader() {
                    return new Plug();
                }
                withParams() {
                    return new Plug();
                }
                put() {
                    return Promise.reject({
                        message: 'Conflict',
                        status: 409,
                        responseText: '{}'
                    });
                }
            }
            return { Plug };
        });
        const Page = require('../page.js').Page;
        const page = new Page(123);
        const success = jest.fn();
        return page.importArchive({}, { name: 'test.mtarc', size: 1000 }, { foo: 'bar' }).then(() => {
            success();
            throw new Error();
        }).catch((e) => {
            expect(success).not.toHaveBeenCalled();
            expect(e).toBeDefined();
        });
    });
    it('can import an archive with a conflict (with progress)', () => {
        jest.mock('mindtouch-http.js/progressPlug.js', () => {
            class ProgressPlug {
                at() {
                    return new ProgressPlug();
                }
                withHeader() {
                    return new ProgressPlug();
                }
                withParams() {
                    return new ProgressPlug();
                }
                put() {
                    return Promise.reject({
                        message: 'Conflict',
                        status: 409,
                        responseText: '{}'
                    });
                }
            }
            return { ProgressPlug };
        });
        const Page = require('../page.js').Page;
        const page = new Page(123);
        const success = jest.fn();
        return page.importArchive({}, { name: 'test.mtarc', size: 1000, progress: () => {} }, { foo: 'bar' }).then(() => {
            success();
            throw new Error();
        }).catch((e) => {
            expect(success).not.toHaveBeenCalled();
            expect(e).toBeDefined();
        });
    });
});
