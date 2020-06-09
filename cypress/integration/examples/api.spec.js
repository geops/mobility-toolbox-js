describe('Api', () => {
  it('loads api page', () => {
    cy.visit('/api');
    cy.get('img[alt=Logo').should('be.ok');
    cy.get('iframe').should('be.ok');
  });
});
