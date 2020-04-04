"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios = require('axios');
var chalk = require('chalk');
var TestRail = /** @class */ (function () {
    function TestRail(options) {
        this.options = options;
        if (options.runId) {
            this.runId = options.runId;
        }
        ;
        this.base = "https://" + options.domain + "/index.php?/api/v2";
    }
    TestRail.prototype.createRun = function (name, description, callback) {
        var _this = this;
        var customField = process.env.TESTRAIL_CUSTOM;
        if (customField) {
            axios({
                method: 'get',
                url: this.base + "/get_cases/" + this.options.projectId + "/&suite_id=" + this.options.suiteId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
                data: JSON.stringify({
                    suite_id: this.options.suiteId,
                    name: name,
                    description: description,
                    include_all: true,
                }),
            })
                .then(function (response) {
                var key = customField.split(":")[0].trim();
                var value = customField.split(":")[1].trim();
                _this.cases = response.data.filter(function (tc) { return tc[key] == value; }).map(function (c) { return c.id; });
                console.log("Creating a run for case id's", _this.cases);
                axios({
                    method: 'post',
                    url: _this.base + "/add_run/" + _this.options.projectId,
                    headers: { 'Content-Type': 'application/json' },
                    auth: {
                        username: _this.options.username,
                        password: _this.options.password,
                    },
                    data: JSON.stringify({
                        suite_id: _this.options.suiteId,
                        name: name,
                        description: description,
                        include_all: false,
                        case_ids: _this.cases,
                    }),
                })
                    .then(function (response) {
                    _this.runId = response.data.id;
                    if (callback) {
                        callback();
                    }
                })
                    .catch(function (error) { return console.error(error); });
            })
                .catch(function (error) { return console.error(error); });
        }
    };
    TestRail.prototype.closeRun = function () {
        axios({
            method: 'post',
            url: this.base + "/close_run/" + this.runId,
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
        }).catch(function (error) { return console.error(error); });
    };
    TestRail.prototype.publishResults = function (results, callback) {
        var _this = this;
        var results_filtered = results.filter(function (res) { return _this.cases.includes(res.case_id); });
        axios({
            method: 'post',
            url: this.base + "/add_results_for_cases/" + this.runId,
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
            data: JSON.stringify({ "results": results_filtered }),
        })
            .then(function (response) {
            console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
            console.log('\n', " - Results are published to " + chalk.magenta("https://" + _this.options.domain + "/index.php?/runs/view/" + _this.runId), '\n');
            if (callback) {
                callback();
            }
        })
            .catch(function (error) { return console.error(error); });
    };
    return TestRail;
}());
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map