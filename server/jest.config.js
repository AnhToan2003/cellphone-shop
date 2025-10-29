export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  transform: {},
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1.js",
  },
  verbose: false,
};
