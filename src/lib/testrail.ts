const axios = require('axios');
const chalk = require('chalk');
import { TestRailOptions, TestRailResult } from './testrail.interface';

export class TestRail {
  private base: String;
  private runId: Number;
  private cases;

  constructor(private options: TestRailOptions) {
    this.base = `https://${options.domain}/index.php?/api/v2`;
  }

  public createRun(name: string, description: string) {
    const customField = process.env.TESTRAIL_CUSTOM;

    if (customField) {
      axios({
        method: 'get',
        url: `${this.base}/get_cases/${this.options.projectId}/&suite_id=${this.options.suiteId}`,
        headers: { 'Content-Type': 'application/json' },
        auth: {
          username: this.options.username,
          password: this.options.password,
        },
        data: JSON.stringify({
          suite_id: this.options.suiteId,
          name,
          description,
          include_all: true,
        }),
      })
        .then(response => {
          const key = customField.split(":")[0].trim();
          const value = customField.split(":")[1].trim();
          this.cases = response.data.filter(tc => tc[key] == value).map(c => c.id);

          console.log(`Creating a run for case id's`, this.cases);

          axios({
            method: 'post',
            url: `${this.base}/add_run/${this.options.projectId}`,
            headers: { 'Content-Type': 'application/json' },
            auth: {
              username: this.options.username,
              password: this.options.password,
            },
            data: JSON.stringify({
              suite_id: this.options.suiteId,
              name,
              description,
              include_all: false,
              case_ids: this.cases,
            }),
          })
            .then(response => {
              this.runId = response.data.id;
            })
            .catch(error => console.error(error));

        })
        .catch(error => console.error(error));
    }
  }

  public deleteRun() {
    axios({
      method: 'post',
      url: `${this.base}/delete_run/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
    }).catch(error => console.error(error));
  }

  public publishResults(results: TestRailResult[]) {
    const results_filtered = results.filter(res => this.cases.includes(res.case_id));

    axios({
      method: 'post',
      url: `${this.base}/add_results_for_cases/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
      data: JSON.stringify({ "results": results_filtered }),
    })
      .then(response => {
        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
        console.log(
          '\n',
          ` - Results are published to ${chalk.magenta(
            `https://${this.options.domain}/index.php?/runs/view/${this.runId}`
          )}`,
          '\n'
        );
      })
      .catch(error => console.error(error));
  }
}
