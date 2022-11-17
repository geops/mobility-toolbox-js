describe('Api', () => {
  it('loads api page', () => {
    cy.visit('/doc');
    cy.get('img[alt=Logo').should('be.ok');
    cy.get('iframe').should('be.ok');
  });
});
