// / <reference types="cypress" />

context('Navigation', () => {
  beforeEach(() => {
    cy.visit('');
    cy.get('header').contains('API').click();
    cy.get('header').contains('Examples').click();
  });

  it("cy.go() - go back or forward in the browser's history", () => {
    // https://on.cypress.io/go

    cy.location('pathname').should('include', 'examples');

    cy.go('back');
    cy.location('pathname').should('include', 'api');

    cy.go('forward');
    cy.location('pathname').should('include', 'examples');

    // clicking back
    cy.go(-1);
    cy.location('pathname').should('include', 'api');

    // clicking forward
    cy.go(1);
    cy.location('pathname').should('include', 'examples');
  });
});
