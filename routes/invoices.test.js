// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeAll(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});


beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO companies
    VALUES ('test', 'Test Company', 'Maker of test.')
    RETURNING code, name, description;
  `);
  testCompany = result.rows[0];

  result = await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('test', 100, false, null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date;
  `);
  testInvoice = result.rows[0];
});

afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async function() {
  // close db connection
  await db.end();
});


/* 
  GET /invoices return JSON of all invoices 
  {invoices: [{id, comp_code}, ...]}
*/
describe("GET /invoices", function() {
  test("Gets a list of 1 invoice", async function() {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [{
        id: testInvoice.id, 
        comp_code: testInvoice.comp_code
      }]
    });
  });
});

/* 
  GET /invoices:id return JSON of a single invoice 
  {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/
describe("GET /invoices/:id", function() {
  test("Gets a single invoice", async function() {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: testInvoice.id,
        amt: testInvoice.amt,
        paid: testInvoice.paid,
        add_date: JSON.parse(JSON.stringify(testInvoice.add_date)),
        paid_date: testInvoice.paid_date,
        company: {
          code: testCompany.code, 
          name: testCompany.name, 
          description: testCompany.description
        }
      }
    });
  });

  test("Responds with 404 if can't find invoices", async function() {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

/* 
  POST /invoice return JSON of a single company
  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
describe("POST /invoices", function() {
  test("Creates a new invoice", async function() {
    const response = await request(app)
      .post(`/invoices`)
      .send({
        comp_code:'test',
        amt: 100
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code:'test',
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      }
    });
  });
});

/* 
  PUT /invoices/:id updated DB return updated JSON of a single company
  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
describe("PUT /invoices/:id", function() {
  test("Updates a single invoice", async function() {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({
        amt: 400
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: testInvoice.id,
        comp_code:testCompany.code,
        amt: 400,
        paid: false,
        add_date: JSON.parse(JSON.stringify(testInvoice.add_date)),
        paid_date: testInvoice.paid_date,
      }
    });
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).patch(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});


/*
  DELETE /invoices/:id delete a company from DB return JSON 
  {status: "deleted"} 
*/
describe("DELETE /invoices/:id", function() {
  test("Deletes a single a invoice", async function() {
    const response = await request(app)
      .delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({status: "deleted"});
  });
});

