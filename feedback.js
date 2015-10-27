/**
 * MindTouch Core JS API
 * Copyright (C) 2006-2015 MindTouch, Inc.
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
import Plug from './plug';
import settings from './settings';
import utility from './lib/utility';
import stringUtility from './lib/stringUtility';
import pageRatingsModel from './models/pageRatings.model';
let feedback = {
    submit: function(options) {
        let path = options.path || stringUtility.leftTrim(window.location.pathname, '/');
        let request = JSON.stringify({
            _path: encodeURIComponent(path),
            userEmail: options.userEmail,
            pageTitle: options.pageTitle,
            siteUrl: options.siteUrl,
            content: options.content,
            contactAllowed: options.contactAllowed
        });
        let plug = new Plug().withHost(settings.get('host')).at('@api', 'deki', 'workflow', 'submit-feedback');
        return plug.post(request, utility.jsonRequestType);
    },
    getRatingsForPages: function(pageIds) {
        var ratingsPlug = new Plug().withHost(settings.get('host')).at('@api', 'deki', 'pages', 'ratings').withParams({ pageids: pageIds.join(',') });
        return ratingsPlug.get().then(pageRatingsModel.parse);
    }
};
export default feedback;