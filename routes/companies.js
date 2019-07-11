const express = require("express");
const router = new express.Router();
const  db = require("../db")
const ExpressError = require("../expressError") // error
const slugify = require('slugify')

/* 
  GET /companies return JSON of all companies 
  {companies: [{code, name}, ...]}
*/
router.get("/", async function(req, res, next) {
  try {
    const results = await db.query(
        `SELECT code, name FROM companies`
      );
    return res.json({companies: results.rows});
  } catch (err) {
    return next(err);
  }
});

/* 
  GET /companies:code return JSON of a single company 
  {company: {code, name, description, invoices: [id, ...]}}
*/
router.get("/:code", async function(req, res, next) {
  try {
    const code = req.params.code;
    const compResult = await db.query(
      `SELECT code, name, description FROM companies
      WHERE code = $1`, [code]
    );
    
    const invoiceResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices
      WHERE comp_code = $1`, [code]
    );
    const company = compResult.rows[0];
    
    if (company === undefined) {
      throw new ExpressError("Company Not Found", 404);
    }

    company.invoices = invoiceResult.rows.map(inv => inv.id);


    return res.json({company: company});
  } catch (err) {
    return next(err);
  }
});


/* 
  POST /companies return JSON of a single company
  {company: {code, name, description}}
*/
router.post("/", async function(req, res, next) {
  try {
    const { code, name, description} = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
    [code, name, description]
    );

    return res.status(201).json({company: result.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/* 
  PUT /companies/:code updated DB return updated JSON of a single company
  {company: {code, name, description}} 
*/
router.put("/:code", async function(req, res, next) {
  try {
    const { name, description} = req.body;
    const code = slugify(req.params.code);

    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
       WHERE code = $3
       RETURNING code, name, description`,
    [name, description, code]
    );

    return res.json({company: result.rows[0]});
  } catch (err) {
    return next(err);
  }
});


/*
  DELETE /companies/:code delete a company from DB return JSON 
  {status: "deleted"} 
*/
router.delete("/:code", async function(req, res, next) {
  try {
    const code = req.params.code;

    const result = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code",
        [code]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("Company Not Found", 404);
    }

    return res.json({status: "deleted"});
  } catch (err) {
    return next(err);
  }
});



module.exports = router;