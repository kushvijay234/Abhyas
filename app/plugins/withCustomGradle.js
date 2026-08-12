const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withCustomGradle(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        "gradle/wrapper/gradle-wrapper.properties"
      );
      if (fs.existsSync(wrapperPath)) {
        let content = fs.readFileSync(wrapperPath, "utf8");
        // Replace the official distributionUrl with the working Tencent Cloud mirror URL
        content = content.replace(
          "https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip",
          "https\\://mirrors.cloud.tencent.com/gradle/gradle-8.14.3-bin.zip"
        );
        fs.writeFileSync(wrapperPath, content, "utf8");
        console.log("[Patched] Successfully updated gradle-wrapper.properties to use Tencent Cloud mirror!");
      } else {
        console.log("[Warn] gradle-wrapper.properties not found at: " + wrapperPath);
      }
      return config;
    },
  ]);
};
