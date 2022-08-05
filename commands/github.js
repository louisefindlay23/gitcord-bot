module.exports = {
  name: "github",
  description: "DMs user to prompt for GitHub Personal Access Token",
  execute(command, message) {
    // -github: Enter personal token
    if (command === "github") {
      return message.author.send(
        "Use `-github-info` with your personal GitHub token to continue. **Guide:** https://bit.ly/3SxAqll"
      );
    }
  },
};