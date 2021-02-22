const testRail = require('testrail-api-client').default;
import { TestRailOptions, TestRailResult } from './testrail.interface';

export class TestRail {
  private client: any;
  private base: String;
  public runId: Number;
  public cases;

  constructor(private options: TestRailOptions) {
    this.base = `https://${options.domain}/index.php?/api/v2`;

    const testRailOptions = {
      domain: `${options.domain}`,
      username: `${options.username}`,
      password: `${options.password}`,
    };

    this.client = new testRail(testRailOptions);
  }

  public createRun(name: string, description: string, callback) {
    const customField = process.env.TESTRAIL_CUSTOM;
    if (customField) {
      this.client
        .getCases(this.options.projectId, this.options.suiteId)
        .then(function (casesInSuite) {
          const key = customField.split(":")[0].trim();
          const value = customField.split(":")[1].trim();
          this.cases = casesInSuite.filter(tc => tc[key] == value).map(c => c.id);

          console.log(`Creating a run for case id's`, this.cases);

          this.client
            .addRun(name, description, this.options.projectId, this.options.suiteId, casesInSuite)
            .then(function (newRunId) {
              this.runId = newRunId;
              if (callback) {
                callback();
              }
            })
            .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
    }
  }

  public closeRun() {
    const testRailRunUrl = `https://${this.options.domain}/index.php?/runs/view/${this.runId}`;

    this.client.closeRun(this.runId)
      .then(() => {
        console.log(`Closed run: ${testRailRunUrl}`);
      })
      .catch(err => {
        console.log(`Failed to close run: ${testRailRunUrl}`);
        console.log(err);
      });
  }

  public publishResults(results: TestRailResult[], callback) {
    const results_filtered = results.filter(res => this.cases.includes(res.case_id));

    this.client
      .addResultsForCases(this.runId, results_filtered)
      .then(() => {
        console.log('\n', '(TestRail Reporter)');
        console.log(
          '\n',
          ` - Results are published to https://${this.options.domain}/index.php?/runs/view/${this.runId}`,
          '\n'
        );
        if (callback) {
          callback();
        }
      })
      .catch((err) => {
        console.log("Failed to addResultsForCases", err);
      });
  }
}
