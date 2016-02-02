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
import {Plug} from './lib/plug';
import {modelHelper} from './models/modelHelper';
import {pageModel} from './models/page.model';
import {subpagesModel} from './models/subpages.model';
import {pageContentsModel} from './models/pageContents.model';
import {pageTreeModel} from './models/pageTree.model';
import {pageTagsModel} from './models/pageTags.model';
import {pageRatingModel} from './models/pageRating.model';
import {pageFilesModel} from './models/pageFiles.model';
import {utility} from './lib/utility';
function _handleVirtualPage(error) {
    if(error.errorCode === 404 && error.response && error.response['@virtual']) {
        return Promise.resolve(pageModel.parse(error.response));
    }
    throw error;
}
export class Page {
    constructor(id = 'home', settings) {
        this._id = utility.getResourceId(id, 'home');
        this._plug = new Plug(settings).at('@api', 'deki', 'pages', this._id);
    }
    getInfo(params = {}) {
        let infoParams = { exclude: 'revision' };
        Object.keys(params).forEach((key) => {
            infoParams[key] = params[key];
        });
        return this._plug.at('info').withParams(infoParams).get().then(pageModel.parse);
    }
    getFullInfo() {
        return this._plug.get().then(pageModel.parse).catch(_handleVirtualPage);
    }
    getContents(params) {
        return this._plug.at('contents').withParams(params).get().then(pageContentsModel.parse);
    }
    getSubpages(params) {
        return this._plug.at('subpages').withParams(params).get().then(subpagesModel.parse);
    }
    getTree(params) {
        return this._plug.at('tree').withParams(params).get().then(pageTreeModel.parse);
    }
    getTreeIds() {
        return this._plug.at('tree').withParam('format', 'ids').get().then((idString) => {
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
    getTags() {
        return this._plug.at('tags').get().then(pageTagsModel.parse);
    }
    getOverview() {
        return this._plug.at('overview').get().then(JSON.parse).then((overview) => {
            return Promise.resolve({ overview: modelHelper.getString(overview) });
        }).catch(() => {
            return Promise.reject('Unable to parse the page overview response');
        });
    }
    getRating() {
        return this._plug.at('ratings').get().then(pageRatingModel.parse);
    }
    rate(rating = '', oldRating = '') {
        rating = rating.toString();
        oldRating = oldRating.toString();
        if(rating !== '1' && rating !== '0' && rating !== '') {
            throw new Error('Invalid rating supplied');
        }
        if(oldRating !== '1' && oldRating !== '0' && oldRating !== '') {
            throw new Error('Invalid rating supplied for the old rating');
        }
        return this._plug.at('ratings').withParams({ score: rating, previousScore: oldRating }).post(null, utility.textRequestType).then(pageRatingModel.parse);
    }
    logPageView() {
        var viewPlug = new Plug().at('@api', 'deki', 'events', 'page-view', this._id).withParam('uri', encodeURIComponent(document.location.href));
        return viewPlug.post(JSON.stringify({ _uri: document.location.href }), utility.jsonRequestType);
    }
    getHtmlTemplate(path, params = {}) {
        params.pageid = this._id;

        // Double-URL-encode the path and add '=' to the beginning.  This makes
        //  it a proper page ID to be used in a URI segment.
        let templatePath = '=' + encodeURIComponent(encodeURIComponent(path));
        let contentsPlug = new Plug().at('@api', 'deki', 'pages', templatePath, 'contents').withParams(params);
        return contentsPlug.get().then(pageContentsModel.parse);
    }
    getFiles(params = {}) {
        return this._plug.at('files').withParams(params).get().then(pageFilesModel.parse);
    }
}
