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
  debugger
  testCompany = result.rows[0];
  console.log("beforeEach test company", testCompany)

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
  GET /companies return JSON of all companies 
  {companies: [{code, name}, ...]}
*/
describe("GET /companies", function() {
  test("Gets a list of 1 company", async function() {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    console.log("RESPONSE BODY!", response.body)
    expect(response.body).toEqual({
      companies: [{
        code: testCompany.code, 
        name: testCompany.name
      }]
    });
  });
});

/* 
  GET /companies:code return JSON of a single company 
  {company: {code, name, description, invoices: [id, ...]}}
*/
describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: [testInvoice.id]
      }
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

/* 
  POST /companies return JSON of a single company
  {company: {code, name, description}}
*/
describe("POST /companies", function() {
  test("Creates a new company", async function() {
    const response = await request(app)
      .post(`/companies`)
      .send({
        code: "test-post",
        name: "Test Post",
        description: "Tests post requests"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: "test-post",
        name: "Test Post",
        description: "Tests post requests"
      }
    });
  });
});

/* 
  PUT /companies/:code updated DB return updated JSON of a single company
  {company: {code, name, description}} 
*/
describe("PUT /companies/:code", function() {
  test("Updates a single company", async function() {
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "PUT",
        description: "Tests put request"
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: "PUT",
        description: "Tests put request"
      }
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).patch(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  test("Deletes a single a company", async function() {
    const response = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({status: "deleted"});
  });
});

