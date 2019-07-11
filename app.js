/** BizTime express application. */


const express = require("express");

const app = express();
const ExpressError = require("./expressError")
const morgan = require("morgan");
const companyRoutes = require('./routes/companies'); // import company routes
const invoiceRoutes = require('./routes/invoices'); // import invoice routes


app.use(morgan('dev'))
app.use(express.json());


app.use("/companies", companyRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
