import { Huewi2Page } from './app.po';

describe('huewi2 App', () => {
  let page: Huewi2Page;

  beforeEach(() => {
    page = new Huewi2Page();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
