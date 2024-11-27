export default {
    transform: {
      "^.+\\.js$": [
        "babel-jest",
        {
          presets: ["@babel/preset-env"],
        },
      ],
    },
    testEnvironment: "node", // 确保 Jest 使用 Node.js 环境
  };
  
  