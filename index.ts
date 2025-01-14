import { Declaration, Plugin, PluginCreator, Result, Rule } from 'postcss';

const IMPORTANT: string = '!important';

function removeLineBreaks(str: string): string {
  return str.replace(/(\r\n|\n|\r)/gm, '');
}

export type PostCssRemoveObjectType = {
  [rule: string]: string;
};

export type PostCssRemoveArrayOrObjectType = string[] | PostCssRemoveObjectType;

export type PostCssRemoveDeclarationOptions = {
  remove?: {
    [selector: string]: string | PostCssRemoveArrayOrObjectType;
  };
  transformLayersToNormalStyles?: boolean | string[];
};

export const PostCssRemoveDeclarationPlugin: PluginCreator<PostCssRemoveDeclarationOptions> = (
  options?: PostCssRemoveDeclarationOptions
): Plugin => {
  const { remove: selectorsToRemove = {}, transformLayersToNormalStyles = false } = options || {};
  const transformLayersToNormalStylesTrimmed: PostCssRemoveDeclarationOptions['transformLayersToNormalStyles'] =
    Array.isArray(transformLayersToNormalStyles)
      ? transformLayersToNormalStyles.map((layer) => layer.trim())
      : transformLayersToNormalStyles;

  return {
    postcssPlugin: 'postcss-remove-declaration',
    prepare: (css: Result) => {
      css.root.walkAtRules('layer', (atRule) => {
        if (
          (Array.isArray(transformLayersToNormalStylesTrimmed) &&
            transformLayersToNormalStylesTrimmed.includes(atRule.params.trim())) ||
          transformLayersToNormalStylesTrimmed === true
        ) {
          atRule.before(atRule.nodes);
          atRule.remove();
        }
      });
      css.root.walkRules((rule: Rule) => {
        const toRemoveForRule = selectorsToRemove[removeLineBreaks(rule.selector)];
        if (!toRemoveForRule) {
          return;
        }
        let toRemoveForRuleArrayOrObject: PostCssRemoveArrayOrObjectType = [];
        if (typeof toRemoveForRule === 'string') {
          if (toRemoveForRule === '*') {
            rule.remove();
            return;
          } else {
            toRemoveForRuleArrayOrObject = [toRemoveForRule];
          }
        } else {
          toRemoveForRuleArrayOrObject = toRemoveForRule;
        }

        if (Array.isArray(toRemoveForRuleArrayOrObject)) {
          rule.walkDecls((declaration: Declaration) => {
            if ((toRemoveForRuleArrayOrObject as string[]).includes(declaration.prop)) {
              declaration.remove();
            }
          });
        } else if (typeof toRemoveForRuleArrayOrObject === 'object') {
          rule.walkDecls((declaration: Declaration) => {
            if (declaration.prop in toRemoveForRuleArrayOrObject) {
              let value = (toRemoveForRuleArrayOrObject as PostCssRemoveObjectType)[
                declaration.prop
              ];
              const hasImportant = value.endsWith(IMPORTANT);
              if (hasImportant) {
                value = value.slice(0, -IMPORTANT.length).trim();
              }
              if (declaration.value === value) {
                if (declaration.important && !hasImportant) return;
                declaration.remove();
              }
            }
          });
        }
      });
      return {};
    },
  };
};

PostCssRemoveDeclarationPlugin.postcss = true;
