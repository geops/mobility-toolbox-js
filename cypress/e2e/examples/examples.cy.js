describe('Examples', () => {
  it('loads a map in the simple map example', () => {
    cy.visit('/examples');
    cy.get('img[alt=Logo').should('be.ok');
    cy.get('canvas').should('be.ok');
  });
});
