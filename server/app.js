const app = require("./utils/config");
const port = process.env.PORT || 8000;

require("./utils/db");
const routes = require("./routes/index.routes");

app.use(routes);

app.listen(port, () => {
  console.log("Listening on port " + port);
});
