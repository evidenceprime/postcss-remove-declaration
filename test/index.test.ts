import postcss from 'postcss';
import { PostCssRemoveDeclarationPlugin } from '..';

describe('PostCssRemoveDeclarationPlugin', () => {
  it('should remove all declarations (*) of a selector', async () => {
    const css = '.a { color: red; font-size: 14px; } .b { color: red }';
    const plugins = [PostCssRemoveDeclarationPlugin({ remove: { '.a': '*' } })];
    const p = await postcss(plugins).process(css, { from: undefined });
    expect(p.css).toMatchInlineSnapshot(`".b { color: red }"`);
  });

  it('should remove provided declarations of a selector', async () => {
    const css =
      '.a { color: red; font-size: 14px; } .b { color: red; background-color: green; font-size: 14px }';
    const plugins = [
      PostCssRemoveDeclarationPlugin({
        remove: { '.a': 'color', '.b': ['color', 'background-color'] },
      }),
    ];
    const p = await postcss(plugins).process(css, { from: undefined });
    expect(p.css).toMatchInlineSnapshot(`".a { font-size: 14px; } .b { font-size: 14px }"`);
  });

  it('should remove a provided declaration only if it has a corresponding value', async () => {
    const css = '.a { color: red; font-size: 14px; } .b { color: red; font-size: 14px }';
    const plugins = [
      PostCssRemoveDeclarationPlugin({
        remove: { '.a': { color: 'green' }, '.b': { color: 'red' } },
      }),
    ];
    const p = await postcss(plugins).process(css, { from: undefined });
    expect(p.css).toMatchInlineSnapshot(
      `".a { color: red; font-size: 14px; } .b { font-size: 14px }"`
    );
  });

  it('should correctly treat !important keyword', async () => {
    const css = '.a { color: red !important; font-size: 14px; } .b { color: red }';
    const plugins = [
      PostCssRemoveDeclarationPlugin({
        remove: { '.a': { color: 'red !important' } },
      }),
    ];
    const p = await postcss(plugins).process(css, { from: undefined });
    expect(p.css).toMatchInlineSnapshot(`".a { font-size: 14px; } .b { color: red }"`);
  });
});
