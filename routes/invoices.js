const express = require("express");
const router = new express.Router();
const  db = require("../db")
const ExpressError = require("../expressError") // error


/* 
  GET /invoices return JSON of all invoices 
  {invoices: [{id, comp_code}, ...]}
*/
router.get("/", async function(req, res, next) {
  try {
    const results = await db.query(
        `SELECT id, comp_code FROM invoices`
      );
    return res.json({invoices: results.rows});
  } catch (err) {
    return next(err);
  }
});

/* 
  GET /invoices:id return JSON of a single invoice 
  {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/
router.get("/:id", async function(req, res, next) {
  try {
    const id = req.params.id;
    
    const invoiceResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code AS company FROM invoices
      WHERE id = $1`, [id]
    );

    const invoice = invoiceResult.rows[0]

    if (invoice === undefined) {
      throw new ExpressError("Invoice Not Found", 404);
    }

    const comp_code = invoice.company
    const companyResult = await db.query(
      `SELECT code, name, description FROM companies
      WHERE code = $1`, [comp_code]
    );

    invoice.company = companyResult.rows[0]
    console.log(invoice)
   

    return res.json({invoice : invoice});
  } catch (err) {
    return next(err);
  }
});


/* 
  POST /invoices return JSON of a single company
  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
    );

    return res.status(201).json({invoice: result.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/* 
  PUT /invoices/:id updated DB return updated JSON of a single company
  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function(req, res, next) {
  try {
    const { amt } = req.body;
    const id = req.params.id;
   

    // const currAmount = await db.query(
    //   `SELECT amt FROM invoices
    //   WHERE id = $1`, [id]
    // );
    // netAmount = currAmount - amt

    // let paid = netAmount === 0
    // let paid_date;
    // if(paid) {paid_date = new Date()}

   
    const result = await db.query(
      `UPDATE invoices SET amt=$1
       WHERE id = $2
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
    );

    return res.json({invoice: result.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/*
  DELETE /invoices/:id delete a company from DB return JSON 
  {status: "deleted"} 
*/
router.delete("/:id", async function(req, res, next) {
  try {
    const id = req.params.id;

    const result = await db.query(
        "DELETE FROM invoices WHERE id = $1 RETURNING id",
        [id]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("Invoice Not Found", 404);
    }
    
    return res.json({status: "deleted"});
  } catch (err) {
    return next(err);
  }
});



module.exports = router;


module.exports = router;