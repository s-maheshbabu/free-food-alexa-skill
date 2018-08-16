const grunt = require("grunt");
grunt.loadNpmTasks("grunt-aws-lambda");

grunt.initConfig({
  lambda_invoke: {
    default: {
      options: {
        file_name: "index.js",
        event: "event.json"
      }
    }
  },
  lambda_deploy: {
    default: {
      options: {
        aliases: "beta",
        enableVersioning: true
      },
      arn:
        "arn:aws:lambda:us-east-1:837603326872:function:free-food-development"
    },
    prod: {
      options: {
        aliases: "prod",
        enableVersioning: true
      },
      arn: "arn:aws:lambda:us-east-1:837603326872:function:free-food-development"
    }
  },
  lambda_package: {
    default: {},
    prod: {}
  }
});

grunt.registerTask("deploy", [
  "lambda_package:default",
  "lambda_deploy:default"
]);
grunt.registerTask("deploy_prod", [
  "lambda_package:prod",
  "lambda_deploy:prod"
]);
