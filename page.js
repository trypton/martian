import { Plug } from 'mindtouch-http.js/plug.js';
import { ProgressPlug } from 'mindtouch-http.js/progressPlug.js';
import { Settings } from './lib/settings.js';
import { utility } from './lib/utility.js';
import { modelParser } from './lib/modelParser.js';
import { PageBase } from './pageBase.js';
import { pageModel } from './models/page.model.js';
import { subpagesModel } from './models/subpages.model.js';
import { pageContentsModel } from './models/pageContents.model.js';
import { pageTreeModel } from './models/pageTree.model.js';
import { pageRatingModel } from './models/pageRating.model.js';
import { pageMoveModel } from './models/pageMove.model.js';
import { pageRatingsModel } from './models/pageRatings.model.js';
import { pageDeleteModel } from './models/pageDelete.model.js';
import { importArchiveModel } from './models/importArchive.model.js';

/**
 * A class for managing a published page.
 */
export class Page extends PageBase {

    /**
     * Construct a new Page.
     * @param {Number|String} [id='home'] The numeric page ID or the page path.
     * @param {Settings} [settings] - The {@link Settings} information to use in construction. If not supplied, the default settings are used.
     */
    constructor(id = 'home', settings = new Settings()) {
        super(id);
        this._settings = settings;
        this._plug = new Plug(settings.host, settings.plugConfig).at('@api', 'deki', 'pages', this._id);
    }

    /**
     * Gets the basic page information.
     * @param {Object} [params] - Additional parameters to direct the API request.
     * @returns {Promise.<pageModel>} - A Promise that, when resolved, yields a {@link pageModel} containing the basic page information.
     */
    getInfo(params = {}) {
        let infoParams = { exclude: 'revision' };
        Object.keys(params).forEach((key) => {
            infoParams[key] = params[key];
        });
        let pageModelParser = modelParser.createParser(pageModel);
        return this._plug.at('info').withParams(infoParams).get().then((r) => r.json()).then(pageModelParser);
    }

    /**
     * Get the subpages of the page.
     * @param {Object} [params] - Additional parameters to direct the API request.
     * @returns {Promise.<subpagesModel>} - A Promise that, when resolved, yields a {@link subpagesModel} containing the basic page information.
     */
    getSubpages(params) {
        return this._plug.at('subpages').withParams(params).get().then((r) => r.json()).then(modelParser.createParser(subpagesModel));
    }

    /**
     * Get a hierarchy tree based on the current page.
     * @param {Object} [params] - Additional parameters to direct the API request.
     * @returns {Promise.<pageTreeModel>} - A Promise that, when resolved, yields a {@link pageTreeModel} containing the basic page information.
     */
    getTree(params) {
        let pageTreeModelParser = modelParser.createParser(pageTreeModel);
        return this._plug.at('tree').withParams(params).get().then((r) => r.json()).then(pageTreeModelParser);
    }

    /**
     * Get the hierarchical list of pages IDs from the current page to the home page.
     * @returns {Promise.<Array>} - The array of hierarchical page IDs.
     */
    getTreeIds() {
        return this._plug.at('tree').withParam('format', 'ids').get().then((r) => r.text()).then((idString) => {
            return idString.split(',').map((id) => {
                let numId = parseInt(id, 10);
                if(isNaN(numId)) {
                    throw new Error('Unable to parse the tree IDs.');
                }
                return numId;
            });
        }).catch((e) => {
            return Promise.reject({ message: e.message });
        });
    }

    /**
     * Gets the rating information for the page.
     * @returns {Promise.<pageRatingModel>} - A Promise that, when resolved, yields a {@link pageRatingModel} containing the rating information.
     */
    getRating() {
        return this._plug.at('ratings').get().then((r) => r.json()).then(modelParser.createParser(pageRatingModel));
    }

    /**
     * Set the rating for the page.
     * @param {Number|null} [rating=null] - The new rating for the page.
     * @param {Number|null} [oldRating=null] - The old rating for the page that is being replaced by {@see rating}.
     * @returns {Promise.<pageRatingModel>} - A Promise that, when resolved, yields a {@link pageRatingModel} containing the new rating information.
     */
    rate(rating = null, oldRating = null) {
        if(rating !== 1 && rating !== 0 && rating !== null) {
            throw new Error('Invalid rating supplied');
        }
        if(oldRating !== 1 && oldRating !== 0 && oldRating !== null) {
            throw new Error('Invalid rating supplied for the old rating');
        }
        if(rating === null) {
            rating = '';
        }
        if(oldRating === null) {
            oldRating = '';
        }
        return this._plug.at('ratings').withParams({ score: rating, previousScore: oldRating }).post(null, utility.textRequestType).then((r) => r.json()).then(modelParser.createParser(pageRatingModel));
    }

    /**
     * Gets a MindTouch template rendered in the context of the current page, as HTML.
     * @param {String} path - The template path.
     * @param {Object} [params] - Additional parameters to direct the API request.
     * @returns {Promise.<pageContentsModel>} - A Promise that, when resolved, yields the rendered HTML within a {@link pageContentsModel}.
     */
    getHtmlTemplate(path, params = {}) {
        params.pageid = this._id;

        // Double-URL-encode the path and add '=' to the beginning.  This makes
        //  it a proper page ID to be used in a URI segment.
        let templatePath = '=' + encodeURIComponent(encodeURIComponent(path));
        let contentsPlug = new Plug(this._settings.host, this._settings.plugConfig).at('@api', 'deki', 'pages', templatePath, 'contents').withParams(params);
        let pageContentsModelParser = modelParser.createParser(pageContentsModel);
        return contentsPlug.get().then((r) => r.json()).then(pageContentsModelParser);
    }

    /**
     * Move a page to a new location in the hierarchy.
     * @param {Object} [params] - Additional parameters to direct the API request.
     * @returns {Promise.<pageMoveModel>} - A Promise that, when resolved, yields a {@link pageMoveModel} containing information regarding the move operation.
     */
    move(params = {}) {
        let pageMoveModelParser = modelParser.createParser(pageMoveModel);
        return this._plug.at('move').withParams(params).post(null, 'text/plain; charset=utf-8').then((r) => r.json()).then(pageMoveModelParser);
    }

    /**
     * Delete a page
     * @returns {Promise.<pageDeleteModel>} - A Promise that, when resolved, yields a {@link pageDeleteModel} containing information regearding pages that were deleted.
     */
    delete(recursive = false) {
        const pageDeleteModelParser = modelParser.createParser(pageDeleteModel);
        return this._plug.withParam('recursive', recursive).delete().then((r) => r.json()).then(pageDeleteModelParser);
    }

    /**
     * Using the current page, activates a draft; copying the page's content and attachments.
     * @returns {Promise.<pageModel>} - A Promise that, when resolved, yields a {@link pageModel} containing the page information following the activation.
     */
    activateDraft() {
        let pageModelParser = modelParser.createParser(pageModel);
        return this._plug.at('activate-draft').post().then((r) => r.json()).then(pageModelParser);
    }

    /**
     * Import a MindTouch archive file as a child node of the page.
     *
     */
    importArchive(file, { name = file.name, size = file.size, type = file.type, progress = null } = {}, params = {}) {
        const apiParams = Object.assign({ filename: name, behavior: 'async' }, params);
        if(progress !== null) {
            const progressPlug = new ProgressPlug(this._settings.host, this._settings.plugConfig).at('@api', 'deki', 'pages', this._id);
            const progressInfo = { callback: progress, size: size };
            return progressPlug.at('import').withParams(apiParams).put(file, type, progressInfo)
                .then((r) => JSON.parse(r.responseText))
                .catch((e) => Promise.reject(JSON.parse(e.responseText)))
                .then(modelParser.createParser(importArchiveModel));
        }
        return this._plug.withHeader('Content-Length', size).withParams(apiParams).at('import').put(file, type)
            .then((r) => r.json())
            .catch((e) => Promise.reject(JSON.parse(e.responseText)))
            .then(modelParser.createParser(importArchiveModel));
    }
}

/**
 * A class for managing all of the published pages on a site.
 */
export class PageManager {
    constructor(settings = new Settings()) {
        this._plug = new Plug(settings.host, settings.plugConfig).at('@api', 'deki', 'pages');
    }

    /**
     * Get the ratings that have been set for a series of pages.
     * @param {Array} pageIds - The list of pages for which ratings data is fetched.
     * @returns {Promise.<pageRatingsModel>} - A Promise that, when resolved, yields a {@link pageRatingsModel} object with the ratings information.
     */
    getRatings(pageIds) {
        const ratingsPlug = this._plug.at('ratings').withParams({ pageids: pageIds.join(',') });
        return ratingsPlug.get().then((r) => r.json()).then(modelParser.createParser(pageRatingsModel));
    }
}
