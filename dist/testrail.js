"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRail = void 0;
var testRail = require('testrail-api-client').default;
var TestRail = /** @class */ (function () {
    function TestRail(options) {
        this.options = options;
        this.base = "https://" + options.domain + "/index.php?/api/v2";
        var testRailOptions = {
            domain: "" + options.domain,
            username: "" + options.username,
            password: "" + options.password,
        };
        this.client = new testRail(testRailOptions);
    }
    TestRail.prototype.createRun = function (name, description, callback) {
        var customField = process.env.TESTRAIL_CUSTOM;
        if (customField) {
            this.client
                .getCases(this.options.projectId, this.options.suiteId)
                .then(function (casesInSuite) {
                var key = customField.split(":")[0].trim();
                var value = customField.split(":")[1].trim();
                this.cases = casesInSuite.filter(function (tc) { return tc[key] == value; }).map(function (c) { return c.id; });
                console.log("Creating a run for case id's", this.cases);
                this.client
                    .addRun(name, description, this.options.projectId, this.options.suiteId, casesInSuite)
                    .then(function (newRunId) {
                    this.runId = newRunId;
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
        var testRailRunUrl = "https://" + this.options.domain + "/index.php?/runs/view/" + this.runId;
        this.client.closeRun(this.runId)
            .then(function () {
            console.log("Closed run: " + testRailRunUrl);
        })
            .catch(function (err) {
            console.log("Failed to close run: " + testRailRunUrl);
            console.log(err);
        });
    };
    TestRail.prototype.publishResults = function (results, callback) {
        var _this = this;
        var results_filtered = results.filter(function (res) { return _this.cases.includes(res.case_id); });
        this.client
            .addResultsForCases(this.runId, results_filtered)
            .then(function () {
            console.log('\n', '(TestRail Reporter)');
            console.log('\n', " - Results are published to https://" + _this.options.domain + "/index.php?/runs/view/" + _this.runId, '\n');
            if (callback) {
                callback();
            }
        })
            .catch(function (err) {
            console.log("Failed to addResultsForCases", err);
        });
    };
    return TestRail;
}());
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map