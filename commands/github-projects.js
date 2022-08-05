const db = require("../database");
const { Octokit } = require("@octokit/core");
const { restEndpointMethods } = require("@octokit/plugin-rest-endpoint-methods");
const MyOctokit = Octokit.plugin(restEndpointMethods);

module.exports = {
  name: "github-projects",
  description: "GitHub Project Functionality",
  usage:
    "To create a new Github project, add create followed by the owner, repo and project title (`-github-project create-project repo-owner repo-name project-title`).\nTo create a new column, add create-column followed by project id and name (`-github-project create-column project-id column-name`).",
  execute(command, message, args, octokit) {
    // -github-projects: Selects GitHub Project Functionality
    if (command === "github-projects") {
      switch (args[0]) {
        case "create-project":
          if (!args[1]) {
            return message.reply(
              "To create a new GitHub Project, add create followed by the owner, repo and project title (`-github-project create-project repo-owner repo-name project-title`)."
            );
          } else {
            let projectTitle = args.slice(3);
            projectTitle = projectTitle.join(" ");
            createProject(projectTitle, octokit);
          }
          break;
        case "create-column":
          if (!args[1]) {
            return message.reply(
              "To create a new column, add create-column followed by project id and name (`-github-project create-column project-id column-name`)."
            );
          } else {
            let columnName = args.slice(2);
            columnName = columnName.join(" ");
            createColumn(columnName, octokit);
          }
          break;
        case "select-project":
          if (!args[1]) {
            return message.reply("Please state how you would like to select your project: by `user`, `org` or `repo`");
            //return message.reply("Please provide your GitHub Project ID in order to select a project.");
          } else if (args[1] === "user") {
            listUserProjects(octokit);
          } else if (args[1] === "repo") {
            if (args[3]) {
              listRepoProjects(args[1], octokit);
            } else {
              return message.reply("Please enter the repo owner's username and name of the repo.");
            }
          } else if (args[1] === "org") {
            listOrgProjects(args[1], octokit);
          } else {
            getProject(args[1], octokit);
          }
          break;
        case "select-column":
          if (!args[1]) {
            return message.reply("Please provide your GitHub Column ID in order to select a column.");
          } else {
            getCards(args[1]), octokit;
          }
          break;
        default:
          return message.reply(
            "Add create (`-github-projects create-project`) to create a new project or select (`-github-projects select-project`) to select an existing project."
          );
      }
    }

    // Create Project function
    async function createProject(projectTitle, octokit) {
      octokit.rest.projects
        .createForRepo({
          owner: args[1],
          repo: args[2],
          name: projectTitle,
        })
        .then(() => {
          return message.reply(`your new project, ${projectTitle} has been created in ${args[1]}'s repo, ${args[2]}.`);
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "creating your project was unsuccessful. Please ensure you have set your GitHub token using -github and entered the information in the correct order of organisation name, repo name and project title and then try again."
          );
        });
    }

    // Create Column function
    async function createColumn(columnName, octokit) {
      octokit.rest.projects
        .createColumn({
          project_id: args[1],
          name: columnName,
        })
        .then(() => {
          return message.reply(`Your new column, ${columnName} has been successfully created in project #${args[1]}.`);
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "creating a column was unsuccessful. Please ensure you have set your GitHub token using -github and provided the correct project ID and a unique column name and then try again."
          );
        });
    }

    // List Projects function
    async function listUserProjects() {
      octokit.rest.users.getAuthenticated().then((result) => {
        const username = result.data.login;
        octokit.rest.projects
          .listForUser({
            username: username,
          })
          .then((result) => {
            const data = [];
            data.push(`**Projects in ${username}'s account:**`);
            result.data.forEach((project) => {
              data.push(`**${project.number}:** ${project.name}\n`);
            });
            return message.reply(data, { split: true });
          })
          .catch((error) => {
            console.error(error);
            return message.reply(
              "Retrieving your user projects was unsuccessful. Please ensure you have user projects."
            );
          });
      });
    }

    async function listRepoProjects() {
      console.log(args[2]);
      octokit.rest.projects
        .listForRepo({
          owner: args[2],
          repo: args[3],
        })
        .then((result) => {
          const data = [];
          data.push(`**Projects in the ${args[3]} repo:**`);
          result.data.forEach((project) => {
            data.push(`**${project.number}:** ${project.name}\n`);
          });
          return message.reply(data, { split: true });
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "Retrieving your repo's projects was unsuccessful. Please ensure this repo has projects and you've entered the correct owner and repo name."
          );
        });
    }

    async function listOrgProjects() {
      console.log(args[2]);
      octokit.rest.projects
        .listForRepo({
          org: args[2],
        })
        .then((result) => {
          const data = [];
          data.push(`**Projects in the ${args[2]} repo:**`);
          result.data.forEach((project) => {
            data.push(`**${project.number}:** ${project.name}\n`);
          });
          return message.reply(data, { split: true });
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "Retrieving your organisations's projects was unsuccessful. Please ensure this organisation has projects and you've entered the correct organisation and you have access to its projects."
          );
        });
    }

    // Get Project function
    async function getProject(projectID, octokit) {
      octokit.rest.projects
        .get({
          project_id: projectID,
        })
        .then(() => {
          getColumns(projectID);
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "Retrieving your project was unsuccessful. Please ensure you have set your GitHub token using `-github` and provided the correct project ID and then try again."
          );
        });
    }

    // Get Columns Function
    async function getColumns(projectID, octokit) {
      octokit.rest.projects
        .listColumns({
          project_id: projectID,
        })
        .then((result) => {
          console.info(result.data);
          let columns = [];
          result.data.forEach((column) => {
            columns.push(column.name);
          });
          columns = columns.join("\r\n • ");
          return message.reply(
            `your project #${projectID} has the following columns:
                        • ${columns}`
          );
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "Retrieving the columns for your project was unsuccessful. Please ensure you have set your GitHub token using -github and provided the correct project ID and then try again."
          );
        });
    }

    // Get Cards Function
    async function getCards(columnID, octokit) {
      octokit.rest.projects
        .listCards({
          column_id: columnID,
        })
        .then((result) => {
          console.info(result.data);
          return message.reply("Cards in column #" + columnID + " have been successfully retrieved.");
        })
        .catch((error) => {
          console.error(error);
          return message.reply(
            "Retrieving the cards in this column was unsuccessful. Please ensure you have set your GitHub token using -github and provided the correct column ID and then try again."
          );
        });
    }
  },
};