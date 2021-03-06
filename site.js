import { Plug } from 'mindtouch-http.js/plug.js';
import { Settings } from './lib/settings.js';
import { utility } from './lib/utility.js';
import { modelParser } from './lib/modelParser.js';
import { searchModel } from './models/search.model.js';
import { siteTagsModelGet, siteTagsModelPost } from './models/siteTags.model.js';

function _buildSearchConstraints(params) {
    let constraints = [];
    if('path' in params) {
        let path = params.path;
        if(path.substr(0, 1) === '/') {
            path = path.substr(1);
        }
        constraints.push('+path.ancestor:' + utility.searchEscape(path));
    }
    if('tags' in params) {
        let tags = params.tags;
        if(typeof tags === 'string' && (tags)) {
            tags = tags.split(',');
        }
        tags.forEach((tag) => {
            constraints.push('+tag:"' + utility.searchEscape(tag) + '"');
        });
    }
    if('type' in params) {
        let types = params.type;
        if(typeof types === 'string' && (types)) {
            types = types.split(',');
        }
        types.forEach((type) => {
            constraints.push('+type:' + utility.searchEscape(type));
        });
    }
    let namespaces = params.namespaces;
    if(typeof namespaces === 'string') {
        namespaces = namespaces.split(',');
    }
    namespaces.forEach((ns) => {
        constraints.push(`+namespace:${utility.searchEscape(ns)}`);
    });
    return '+(' + constraints.join(' ') + ')';
}

function _getBatchTagsTemplate(data) {
    var postBatchTagsTemplate = '<?xml version="1.0"?><tags>';
    if(Array.isArray(data.add) && data.add.length > 0) {
        data.add.forEach((elm) => {
            let tagStr = `<tag.add value="${utility.escapeHTML(elm.name)}">`;
            elm.pageids.forEach((id) => {
                tagStr += `<page id="${id}"></page>`;
            });
            tagStr += '</tag.add>';

            postBatchTagsTemplate = postBatchTagsTemplate + tagStr;
        });
    }
    if(Array.isArray(data.remove) && data.remove.length > 0) {
        data.remove.forEach((elm) => {
            let tagStr = `<tag.remove value="${utility.escapeHTML(elm.name)}">`;
            elm.pageids.forEach((id) => {
                tagStr += `<page id="${id}"></page>`;
            });
            tagStr += '</tag.remove>';
            postBatchTagsTemplate = postBatchTagsTemplate + tagStr;
        });
    }
    postBatchTagsTemplate = `${postBatchTagsTemplate}</tags>`;
    return postBatchTagsTemplate;
}

/**
 * A class for administering aspects of a MindTouch site.
 */
export class Site {

    /**
     * Construct a Site object.
     * @param {Settings} [settings] - The {@link Settings} information to use in construction. If not supplied, the default settings are used.
     */
    constructor(settings = new Settings()) {
        this.plug = new Plug(settings.host, settings.plugConfig).at('@api', 'deki', 'site');
    }

    /**
     * Get the localized string corresponding to the supplied resource key.
     * @param {Object} options - Options to direct the fetching of the localized string.
     * @param {String} options.key - The key that identifies the string to fetch.
     * @param {String} [options.lang] - A language code used to fetch the string in a specific language.  If not supplied, the current system language will be used.
     * @returns {Promise.<String>} - A Promise that, when resolved, yields the fetched string.
     */
    getResourceString(options = {}) {
        if(!('key' in options)) {
            return Promise.reject('No resource key was supplied');
        }
        let locPlug = this.plug.at('localization', options.key);
        if('lang' in options) {
            locPlug = locPlug.withParam('lang', options.lang);
        }
        return locPlug.get().then((r) => r.text());
    }

    /**
     * Get tags list.
     * @param {String} [q=''] - A tag string to contrain search results to pages containing this tag.
     */
    getTags(params = {}) {
        const siteTagsModelParser = modelParser.createParser(siteTagsModelGet);
        return this.plug.at('tags').withParams(params).get().then((r) => r.json()).then(siteTagsModelParser);
    }

    /**
     * Post tags list for each page that each tag in contained in.
     * @param {Object} options - Options to direct the fetching of the localized tags.
     * @param {Array} options.add=[] - A tag array containing all the pages containing this tag where they need to be added.
     * @param {Array} options.remove=[] - A tag array containing all the pages containing this tag where they need to be removed.
     */
    setTags(params = {}) {
        const XMLBatchData = _getBatchTagsTemplate(params);
        const siteTagsModelParser = modelParser.createParser(siteTagsModelPost);
        return this.plug.at('tags').post(XMLBatchData, 'application/xml').then((r) => r.json()).then(siteTagsModelParser);
    }

    /**
     * Perform a search across the site.
     * This function takes a single parameter with the following options.
     * @param {Number} [limit=10] - Limit search results to the specified number of items per paginated page.
     * @param {Number} [offset=10] - The index in the total query results at which to begin the returned result set.
     * @param {String|Array} [tags=''] - A comma-separated list or array of tags to constrain search results to items containing one of the tags.
     * @param {String|Array} [type=''] - Type or types to filter the results in a comma delimited list or an array.  Valid types: `wiki`, `document`, `image`, `binary`
     * @param {String} [q=''] - Search keywords or advanced search syntax.
     * @param {String} [path=''] - A page path to constrain the search results to items located under the specified path.
     * @param {String|Array} [namespace='main'] - A comma-separated list or array of namespaces to filter the results by. Valid namespaces: 'main', 'template', 'user'.
     * @param {Boolean} [recommendations=true] - `true` to include recommended search results based off site configuration. `false` to suppress them.
     * @returns {Promise.<searchModel>} - A Promise that, when resolved, yields the results from the search in a {@link searchModel}.
     */
    search({ limit = 10, offset = 0, q = '', path = '', recommendations = true, tags = '', type = '', namespaces = 'main' } = {}) {
        const constraint = {};
        if(path !== '' && path !== '/') {
            constraint.path = path;
        }
        if(tags !== '') {
            constraint.tags = tags;
        }
        if(type !== '') {
            constraint.type = type;
        }
        constraint.namespaces = namespaces;
        const searchParams = {
            limit: limit,
            offset: offset,
            sortBy: '-date,-rank',
            q: q,
            summarypath: encodeURI(path),
            constraint: _buildSearchConstraints(constraint),
            recommendations: recommendations
        };
        return this.plug.at('query').withParams(searchParams).get().then((r) => r.json()).then(modelParser.createParser(searchModel));
    }
}
